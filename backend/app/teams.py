from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_active_user, RequireRole

router = APIRouter(prefix="/teams", tags=["Teams"])

# Local schemas for Team
class TeamBase(BaseModel):
    name: str

class TeamCreate(TeamBase):
    pass

class TeamResponse(TeamBase):
    id: UUID
    branch_id: UUID
    leader_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TeamMemberCreate(BaseModel):
    user_id: UUID

@router.get("/", response_model=List[TeamResponse])
def get_teams(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """Returns a list of teams that belong to the current_user's branch."""
    if current_user.role == models.UserRole.SYSTEM_ADMIN.value:
        return db.query(models.Team).all()
    
    if not current_user.branch_id:
        return []

    return db.query(models.Team).filter(models.Team.branch_id == current_user.branch_id).all()

@router.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team: TeamCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RequireRole(["Team Leader", "Branch Manager", "Branch Admin", "System Admin"]))
):
    """
    Creates a new team in the user's branch and automatically adds the creator as the leader.
    """
    if not current_user.branch_id:
         raise HTTPException(status_code=400, detail="User must be assigned to a branch to create a team.")

    new_team = models.Team(
        name=team.name,
        branch_id=current_user.branch_id,
        leader_id=current_user.id
    )
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    
    # Automatically add the leader to the team's member association list
    new_team.members.append(current_user)
    db.commit()
    db.refresh(new_team)
    
    return new_team

@router.get("/{team_id}/members", response_model=List[schemas.User])
def get_team_members(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Returns a list of users mapped to this team via the team_members association table."""
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
        
    if current_user.role != models.UserRole.SYSTEM_ADMIN.value and team.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not authorized to view teams outside your branch.")
        
    return team.members

@router.post("/{team_id}/members", status_code=status.HTTP_201_CREATED)
def add_team_member(
    team_id: UUID,
    member: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RequireRole(["Team Leader", "Branch Manager", "Branch Admin", "System Admin"]))
):
    """
    Adds a user to the team_members table. 
    Verifies the target user belongs to the same branch as the team.
    """
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
        
    if current_user.role != models.UserRole.SYSTEM_ADMIN.value and team.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify teams outside your branch.")
        
    target_user = db.query(models.User).filter(models.User.id == member.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if target_user.branch_id != team.branch_id:
        raise HTTPException(status_code=400, detail="Target user does not belong to the same branch as the team.")
        
    if target_user in team.members:
        raise HTTPException(status_code=400, detail="User is already a member of this team.")
        
    team.members.append(target_user)
    db.commit()
    
    return {"message": f"User {target_user.email} added to team {team.name} successfully."}
