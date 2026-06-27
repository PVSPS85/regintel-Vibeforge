from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_active_user, RequireRole

router = APIRouter(prefix="/users", tags=["Users"])

# Local schema for PATCH endpoint since it wasn't requested previously
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[schemas.Role] = None

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    """Retrieve the profile of the currently authenticated user."""
    return current_user

@router.get("/", response_model=List[schemas.User])
def read_users(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Retrieve branch-scoped users.
    Hackathon fallback: if the user's branch has no other users, resolve
    MG Road Branch by name and return its users so the demo always has
    chat contacts and team members available.
    """
    role_val = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_val == models.UserRole.SYSTEM_ADMIN.value:
        return db.query(models.User).all()

    # Priority 1: user's own branch
    branch_id = current_user.branch_id
    users = []
    if branch_id:
        users = db.query(models.User).filter(models.User.branch_id == branch_id).all()

    # Priority 2 (Hackathon Bypass): fall back to MG Road Branch if empty
    if not users:
        mg_branch = (
            db.query(models.Branch)
            .filter(models.Branch.name.ilike("%MG Road%"))
            .first()
        )
        if mg_branch:
            users = db.query(models.User).filter(models.User.branch_id == mg_branch.id).all()

    # Priority 3: absolute last resort — return all active users
    if not users:
        users = db.query(models.User).filter(models.User.is_active == True).all()

    return users

@router.patch("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RequireRole(["Branch Admin", "System Admin"]))
):
    """
    Update a user's details. 
    Protected by RequireRole. Branch Admins are limited to their own branch.
    """
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Strict Branch Admin isolation check
    if current_user.role != models.UserRole.SYSTEM_ADMIN.value:
        if current_user.branch_id != target_user.branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Not authorized to edit users outside your branch"
            )

    # Apply updates
    if user_update.name is not None:
        target_user.name = user_update.name
    if user_update.email is not None:
        target_user.email = user_update.email
    if user_update.role is not None:
        target_user.role = user_update.role

    db.commit()
    db.refresh(target_user)
    return target_user
