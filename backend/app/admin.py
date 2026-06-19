from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app import models
from app.dependencies import RequireRole

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/compliance-stats")
def get_compliance_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RequireRole([
        "Auditor", "System Admin", "Branch Manager", "Branch Admin"
    ]))
):
    """
    Returns aggregated task metrics for compliance monitoring analytics.
    Filters by the user's branch unless they are a System Admin or an Auditor 
    who is intentionally granted cross-branch visibility.
    """
    query = db.query(models.Task)
    
    # Restrict to user's branch if they are a Branch Manager or Branch Admin
    # System Admins and Auditors typically see the entire organization's stats.
    if current_user.role in [models.UserRole.BRANCH_MANAGER.value, models.UserRole.BRANCH_ADMIN.value]:
        query = query.filter(models.Task.branch_id == current_user.branch_id)
        
    total_tasks = query.count()
    
    total_pending = query.filter(models.Task.status == models.TaskStatus.PENDING).count()
    total_in_progress = query.filter(models.Task.status == models.TaskStatus.IN_PROGRESS).count()
    total_completed = query.filter(models.Task.status == models.TaskStatus.COMPLETED).count()
    
    # Overdue = due_date is in the past AND status is not COMPLETED or CANCELLED
    today = date.today()
    total_overdue = query.filter(
        models.Task.due_date < today,
        models.Task.status.notin_([models.TaskStatus.COMPLETED, models.TaskStatus.CANCELLED])
    ).count()

    return {
        "total_tasks": total_tasks,
        "total_pending": total_pending,
        "total_in_progress": total_in_progress,
        "total_completed": total_completed,
        "total_overdue": total_overdue
    }
