from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel

from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_active_user, RequireRole

router = APIRouter(prefix="/branches", tags=["Branches"])

# Local schemas for transfer requests
class TransferRequestCreate(BaseModel):
    to_branch_id: UUID

class TransferRequestResponse(BaseModel):
    id: UUID
    user_id: UUID
    from_branch_id: UUID
    to_branch_id: UUID
    status: models.TransferRequestStatus

    class Config:
        from_attributes = True

@router.get("/", response_model=List[schemas.Branch])
def get_branches(db: Session = Depends(get_db)):
    """Retrieve a list of all active branches."""
    return db.query(models.Branch).all()

@router.post("/transfer-requests", response_model=TransferRequestResponse)
def request_transfer(
    transfer: TransferRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Allow an employee to request a transfer to a different branch.
    Creates a TransferRequest record with status="Pending".
    """
    if not current_user.branch_id:
        raise HTTPException(status_code=400, detail="User is not assigned to a branch yet.")

    if current_user.branch_id == transfer.to_branch_id:
        raise HTTPException(status_code=400, detail="Cannot transfer to your current branch.")

    target_branch = db.query(models.Branch).filter(models.Branch.id == transfer.to_branch_id).first()
    if not target_branch:
        raise HTTPException(status_code=404, detail="Destination branch not found.")

    new_request = models.TransferRequest(
        user_id=current_user.id,
        from_branch_id=current_user.branch_id,
        to_branch_id=transfer.to_branch_id,
        status=models.TransferRequestStatus.PENDING
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

@router.get("/transfer-requests", response_model=List[TransferRequestResponse])
def get_transfer_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RequireRole(["Branch Manager", "Branch Admin", "System Admin"]))
):
    """
    Returns pending transfer requests relevant to the manager's branch.
    System Admins see all pending and in-progress requests.
    """
    query = db.query(models.TransferRequest).filter(
        models.TransferRequest.status.in_([
            models.TransferRequestStatus.PENDING, 
            models.TransferRequestStatus.SOURCE_APPROVED
        ])
    )

    if current_user.role != models.UserRole.SYSTEM_ADMIN.value:
        query = query.filter(
            or_(
                models.TransferRequest.from_branch_id == current_user.branch_id,
                models.TransferRequest.to_branch_id == current_user.branch_id
            )
        )
    return query.all()

@router.post("/transfer-requests/{request_id}/approve")
def approve_transfer(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RequireRole(["Branch Manager", "Branch Admin", "System Admin"]))
):
    """
    Dual-approval logic:
    1. Source branch manager approves -> SOURCE_APPROVED
    2. Destination branch manager approves -> COMPLETED (and user branch_id updates)
    """
    transfer = db.query(models.TransferRequest).filter(models.TransferRequest.id == request_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer request not found.")

    if transfer.status == models.TransferRequestStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Transfer is already completed.")
    if transfer.status == models.TransferRequestStatus.DENIED:
        raise HTTPException(status_code=400, detail="Transfer was denied.")

    is_sysadmin = current_user.role == models.UserRole.SYSTEM_ADMIN.value
    is_source = current_user.branch_id == transfer.from_branch_id
    is_dest = current_user.branch_id == transfer.to_branch_id

    if not (is_sysadmin or is_source or is_dest):
        raise HTTPException(status_code=403, detail="Not authorized to approve this transfer.")

    # Source manager approval
    if is_source and transfer.status == models.TransferRequestStatus.PENDING:
        transfer.status = models.TransferRequestStatus.SOURCE_APPROVED
        db.commit()
        return {"message": "Transfer approved by source branch manager.", "status": transfer.status}

    # Destination manager approval
    if is_dest or is_sysadmin:
        # Require source approval first unless sysadmin
        if transfer.status == models.TransferRequestStatus.PENDING and not is_sysadmin:
            raise HTTPException(
                status_code=400, 
                detail="Source branch manager must approve the transfer first."
            )
        
        # Complete the transfer
        transfer.status = models.TransferRequestStatus.COMPLETED
        user = db.query(models.User).filter(models.User.id == transfer.user_id).first()
        if user:
            user.branch_id = transfer.to_branch_id
            
        db.commit()
        return {"message": "Transfer fully approved and user branch updated.", "status": transfer.status}

    return {"message": "No action taken. Check current request status.", "status": transfer.status}

@router.post("/transfer-requests/{request_id}/deny")
def deny_transfer(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RequireRole(["Branch Manager", "Branch Admin", "System Admin"]))
):
    """
    Deny a transfer request. Either source or destination manager can deny it.
    """
    transfer = db.query(models.TransferRequest).filter(models.TransferRequest.id == request_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer request not found.")

    is_sysadmin = current_user.role == models.UserRole.SYSTEM_ADMIN.value
    is_source = current_user.branch_id == transfer.from_branch_id
    is_dest = current_user.branch_id == transfer.to_branch_id

    if not (is_sysadmin or is_source or is_dest):
        raise HTTPException(status_code=403, detail="Not authorized to deny this transfer.")

    transfer.status = models.TransferRequestStatus.DENIED
    db.commit()
    return {"message": "Transfer request denied.", "status": transfer.status}
