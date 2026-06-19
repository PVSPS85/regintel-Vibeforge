from typing import List, Optional
from uuid import UUID
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_active_user, RequireRole

router = APIRouter(prefix="/tasks", tags=["Tasks"])

# Local schemas for Task
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to_user: Optional[UUID] = None
    assigned_to_team: Optional[UUID] = None
    status: Optional[models.TaskStatus] = models.TaskStatus.PENDING
    priority: Optional[models.TaskPriority] = models.TaskPriority.MEDIUM
    due_date: Optional[date] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to_user: Optional[UUID] = None
    assigned_to_team: Optional[UUID] = None
    status: Optional[models.TaskStatus] = None
    priority: Optional[models.TaskPriority] = None
    due_date: Optional[date] = None

class TaskResponse(TaskBase):
    id: UUID
    branch_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    status: Optional[models.TaskStatus] = Query(None),
    assigned_to_user: Optional[UUID] = Query(None),
    assigned_to_team: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Returns a list of tasks.
    Filters implicitly by current_user.branch_id for non-sysadmins.
    Supports optional status, user, and team query parameters.
    """
    query = db.query(models.Task)
    
    if current_user.role != models.UserRole.SYSTEM_ADMIN.value:
        query = query.filter(models.Task.branch_id == current_user.branch_id)
        
    if status:
        query = query.filter(models.Task.status == status)
    if assigned_to_user:
        query = query.filter(models.Task.assigned_to_user == assigned_to_user)
    if assigned_to_team:
        query = query.filter(models.Task.assigned_to_team == assigned_to_team)
        
    return query.all()

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RequireRole(["Team Leader", "Branch Manager", "Branch Admin", "System Admin"]))
):
    """
    Creates a new task.
    Verifies that assigned_to_user or assigned_to_team belong to the creator's branch.
    """
    if not current_user.branch_id and current_user.role != models.UserRole.SYSTEM_ADMIN.value:
        raise HTTPException(status_code=400, detail="User must belong to a branch to create a task.")
        
    if task.assigned_to_user:
        target_user = db.query(models.User).filter(models.User.id == task.assigned_to_user).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Assigned user not found.")
        if target_user.branch_id != current_user.branch_id and current_user.role != models.UserRole.SYSTEM_ADMIN.value:
            raise HTTPException(status_code=400, detail="Assigned user must belong to your branch.")
            
    if task.assigned_to_team:
        target_team = db.query(models.Team).filter(models.Team.id == task.assigned_to_team).first()
        if not target_team:
            raise HTTPException(status_code=404, detail="Assigned team not found.")
        if target_team.branch_id != current_user.branch_id and current_user.role != models.UserRole.SYSTEM_ADMIN.value:
            raise HTTPException(status_code=400, detail="Assigned team must belong to your branch.")

    new_task = models.Task(
        title=task.title,
        description=task.description,
        assigned_to_user=task.assigned_to_user,
        assigned_to_team=task.assigned_to_team,
        branch_id=current_user.branch_id,
        status=task.status or models.TaskStatus.PENDING,
        priority=task.priority or models.TaskPriority.MEDIUM,
        due_date=task.due_date
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Returns a specific task, ensuring it belongs to the user's branch.
    """
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
        
    if current_user.role != models.UserRole.SYSTEM_ADMIN.value and task.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not authorized to view tasks outside your branch.")
        
    return task

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: UUID,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Allows updating a task.
    Regular employees can only update tasks assigned to them or their team.
    Managers can update any task in their branch.
    """
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
        
    is_sysadmin = current_user.role == models.UserRole.SYSTEM_ADMIN.value
    is_manager = current_user.role in [models.UserRole.BRANCH_MANAGER.value, models.UserRole.BRANCH_ADMIN.value, models.UserRole.TEAM_LEADER.value]
    
    if not is_sysadmin and task.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit tasks outside your branch.")
        
    if not is_sysadmin and not is_manager:
        # Regular employee: verify it's assigned to them or their team
        user_team_ids = [team.id for team in current_user.teams]
        if task.assigned_to_user != current_user.id and task.assigned_to_team not in user_team_ids:
            raise HTTPException(status_code=403, detail="Not authorized to edit this task. It must be assigned to you or your team.")

    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
        
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RequireRole(["Branch Manager", "Branch Admin", "System Admin"]))
):
    """
    Cancels/deletes a task. Protected by manager roles only.
    """
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
        
    if current_user.role != models.UserRole.SYSTEM_ADMIN.value and task.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete tasks outside your branch.")
        
    db.delete(task)
    db.commit()
    return None
