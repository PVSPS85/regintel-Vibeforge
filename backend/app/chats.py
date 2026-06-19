from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app import models
from app.dependencies import get_current_active_user

router = APIRouter(prefix="/chats", tags=["Chats"])

# Local schemas for Chat
class ChatMessageBase(BaseModel):
    content: str

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: UUID
    chat_id: UUID
    sender_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class ChatCreate(BaseModel):
    is_group: bool = False
    team_id: Optional[UUID] = None
    target_user_id: Optional[UUID] = None

class ChatResponse(BaseModel):
    id: UUID
    is_group: bool
    team_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ChatResponse])
def get_chats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """
    Returns a list of chats available to the user.
    - DMs they are part of
    - Group chats linked to teams they are members of
    """
    # Find chats where the user is a direct member (DMs or specific group chats)
    direct_chats = db.query(models.Chat).join(models.chat_members).filter(
        models.chat_members.c.user_id == current_user.id
    ).all()
    
    # Find team chats where user is in the team
    user_team_ids = [team.id for team in current_user.teams]
    if current_user.led_teams:
        user_team_ids.extend([team.id for team in current_user.led_teams])
        
    team_chats = db.query(models.Chat).filter(
        models.Chat.is_group == True,
        models.Chat.team_id.in_(user_team_ids)
    ).all()
    
    # Combine and deduplicate
    all_chats = {chat.id: chat for chat in direct_chats + team_chats}
    return list(all_chats.values())

@router.post("/", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
def create_chat(
    chat_req: ChatCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Creates a new chat room.
    """
    new_chat = models.Chat(
        is_group=chat_req.is_group,
        team_id=chat_req.team_id
    )
    
    if chat_req.is_group:
        if not chat_req.team_id:
            raise HTTPException(status_code=400, detail="team_id is required for group chats.")
        team = db.query(models.Team).filter(models.Team.id == chat_req.team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found.")
        if team.branch_id != current_user.branch_id and current_user.role != models.UserRole.SYSTEM_ADMIN.value:
            raise HTTPException(status_code=403, detail="Cannot create a chat for a team outside your branch.")
        
        new_chat.members.append(current_user)
        
    else:
        if not chat_req.target_user_id:
            raise HTTPException(status_code=400, detail="target_user_id is required for DMs.")
            
        target_user = db.query(models.User).filter(models.User.id == chat_req.target_user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found.")
            
        if target_user.branch_id != current_user.branch_id and current_user.role != models.UserRole.SYSTEM_ADMIN.value:
            raise HTTPException(status_code=403, detail="Users must be in the same branch to DM.")
            
        new_chat.members.append(current_user)
        if target_user.id != current_user.id:
            new_chat.members.append(target_user)
            
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat

def check_chat_access(chat: models.Chat, current_user: models.User):
    if current_user.role == models.UserRole.SYSTEM_ADMIN.value:
        return True
    if current_user in chat.members:
        return True
    if chat.is_group and chat.team_id:
        user_team_ids = [team.id for team in current_user.teams] + [team.id for team in current_user.led_teams]
        if chat.team_id in user_team_ids:
            return True
    return False

@router.get("/{chat_id}/messages", response_model=List[ChatMessageResponse])
def get_chat_messages(
    chat_id: UUID,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Returns the message history for a specific chat with basic pagination.
    """
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
        
    if not check_chat_access(chat, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to view this chat.")
        
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.chat_id == chat_id
    ).order_by(models.ChatMessage.created_at.desc()).offset(skip).limit(limit).all()
    
    return messages

@router.post("/{chat_id}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def send_chat_message(
    chat_id: UUID,
    message: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Creates a new ChatMessage associated with the chat and the sender_id.
    """
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
        
    if not check_chat_access(chat, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to post in this chat.")
        
    new_message = models.ChatMessage(
        chat_id=chat_id,
        sender_id=current_user.id,
        content=message.content
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message
