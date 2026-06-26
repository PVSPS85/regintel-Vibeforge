from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app import models
from app.dependencies import get_current_active_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# Local schema for Notification
class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Returns all notifications for the current user.
    Can be filtered to only return unread notifications.
    """
    query = db.query(models.Notification).filter(models.Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(models.Notification.is_read == False)
        
    return query.order_by(models.Notification.created_at.desc()).all()

@router.patch("/{notification_id}/mark-read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Updates a specific notification's is_read status to True.
    Ensures the notification belongs to the current user.
    """
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found or access denied.")
        
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification

@router.post("/mark-all-read", status_code=status.HTTP_200_OK)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    A utility endpoint that updates all of the current user's unread notifications to read.
    """
    unread_notifications = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).all()
    
    for notification in unread_notifications:
        notification.is_read = True
        
    db.commit()
    return {"message": f"Successfully marked {len(unread_notifications)} notifications as read."}
