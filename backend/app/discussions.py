from typing import List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app import models
from app.dependencies import get_current_active_user

router = APIRouter(prefix="/discussions", tags=["Discussions"])

# Local schemas
class TopicCreate(BaseModel):
    title: str
    content: str

class TopicResponse(TopicCreate):
    id: UUID
    branch_id: UUID
    author_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str

class CommentResponse(CommentCreate):
    id: UUID
    topic_id: UUID
    author_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[TopicResponse])
def get_topics(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_active_user)
):
    """
    List discussion topics for the user's branch.
    System Admins can see all topics across the platform.
    """
    if current_user.role == models.UserRole.SYSTEM_ADMIN.value:
        return db.query(models.DiscussionTopic).order_by(models.DiscussionTopic.created_at.desc()).all()
        
    if not current_user.branch_id:
        return []
        
    return db.query(models.DiscussionTopic).filter(
        models.DiscussionTopic.branch_id == current_user.branch_id
    ).order_by(models.DiscussionTopic.created_at.desc()).all()

@router.post("/", response_model=TopicResponse, status_code=status.HTTP_201_CREATED)
def create_topic(
    topic: TopicCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Create a new discussion topic strictly within the user's branch.
    """
    if not current_user.branch_id:
        raise HTTPException(status_code=400, detail="User must belong to a branch to create a topic.")
        
    new_topic = models.DiscussionTopic(
        branch_id=current_user.branch_id,
        author_id=current_user.id,
        title=topic.title,
        content=topic.content
    )
    db.add(new_topic)
    db.commit()
    db.refresh(new_topic)
    return new_topic

@router.get("/{topic_id}/comments", response_model=List[CommentResponse])
def get_comments(
    topic_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    List all comments for a specific discussion topic.
    Verifies that the user has access to the topic's overarching branch.
    """
    topic = db.query(models.DiscussionTopic).filter(models.DiscussionTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found.")
        
    if current_user.role != models.UserRole.SYSTEM_ADMIN.value and topic.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not authorized to view topics outside your branch.")
        
    return db.query(models.DiscussionComment).filter(
        models.DiscussionComment.topic_id == topic_id
    ).order_by(models.DiscussionComment.created_at.asc()).all()

@router.post("/{topic_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    topic_id: UUID,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Add a new comment to a specific discussion topic.
    Verifies that the user has access to the topic's overarching branch.
    """
    topic = db.query(models.DiscussionTopic).filter(models.DiscussionTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found.")
        
    if current_user.role != models.UserRole.SYSTEM_ADMIN.value and topic.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not authorized to comment on topics outside your branch.")
        
    new_comment = models.DiscussionComment(
        topic_id=topic_id,
        author_id=current_user.id,
        content=comment.content
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment
