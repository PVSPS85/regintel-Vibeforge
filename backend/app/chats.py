"""
chats.py
--------
FastAPI router for RegIntel internal messaging system.

Endpoints:
  GET  /chats/                        → list all chats visible to current user
  POST /chats/                        → create / retrieve DM or team group chat
  GET  /chats/{chat_id}/messages      → fetch message history (ascending, paginated)
  POST /chats/{chat_id}/messages      → send a new message to a chat thread
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel

from app.database import get_db
from app import models
from app.dependencies import get_current_active_user

router = APIRouter(prefix="/chats", tags=["Chats"])


# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: UUID
    chat_id: UUID
    sender_id: UUID
    sender_name: str = "Unknown"
    sender_role: str = ""
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatCreate(BaseModel):
    is_group: bool = False
    team_id: Optional[UUID] = None
    target_user_id: Optional[UUID] = None


class ChatMemberInfo(BaseModel):
    id: UUID
    name: str
    email: Optional[str] = None
    role: Optional[str] = None

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    id: UUID
    is_group: bool
    team_id: Optional[UUID] = None
    display_name: str = "Chat"
    members: List[ChatMemberInfo] = []
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Helpers ───────────────────────────────────────────────────────────────────

def _resolve_message(msg: models.ChatMessage) -> ChatMessageResponse:
    """
    Converts an ORM ChatMessage into a ChatMessageResponse dict,
    eager-resolving sender_name and sender_role from the already-loaded
    sender relationship before the session may close.
    """
    sender_name = "Unknown"
    sender_role = ""
    if msg.sender:
        sender_name = msg.sender.name or "Unknown"
        # role is an Enum — return its .value string
        raw_role = msg.sender.role
        sender_role = raw_role.value if hasattr(raw_role, "value") else str(raw_role)

    return ChatMessageResponse(
        id=msg.id,
        chat_id=msg.chat_id,
        sender_id=msg.sender_id,
        sender_name=sender_name,
        sender_role=sender_role,
        content=msg.content,
        created_at=msg.created_at,
    )


def _resolve_chat(chat: models.Chat) -> ChatResponse:
    """
    Converts an ORM Chat into a ChatResponse, resolving display_name and
    members eagerly from the already-loaded relationships.
    """
    # display_name
    if chat.is_group:
        display_name = chat.team.name if chat.team else "Group Chat"
    else:
        display_name = ", ".join(m.name for m in chat.members) if chat.members else "Direct Message"

    # members list
    members = [
        ChatMemberInfo(
            id=m.id,
            name=m.name,
            email=m.email,
            role=m.role.value if hasattr(m.role, "value") else str(m.role),
        )
        for m in (chat.members or [])
    ]

    return ChatResponse(
        id=chat.id,
        is_group=chat.is_group,
        team_id=chat.team_id,
        display_name=display_name,
        members=members,
        created_at=chat.created_at,
    )


def _check_chat_access(chat: models.Chat, current_user: models.User) -> bool:
    """Returns True if the current user has read/write access to this chat."""
    role_val = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_val == models.UserRole.SYSTEM_ADMIN.value:
        return True
    if current_user in chat.members:
        return True
    if chat.is_group and chat.team_id:
        user_team_ids = (
            [t.id for t in current_user.teams]
            + [t.id for t in current_user.led_teams]
        )
        if chat.team_id in user_team_ids:
            return True
    return False


def _load_chat(db: Session, chat_id: UUID) -> models.Chat:
    """Fetches a Chat with all required relationships eagerly loaded."""
    chat = (
        db.query(models.Chat)
        .options(
            joinedload(models.Chat.members),
            joinedload(models.Chat.team),
        )
        .filter(models.Chat.id == chat_id)
        .first()
    )
    return chat


# ─── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[ChatResponse])
def get_chats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Returns all chats visible to the authenticated user:
    • Direct messages where they are a chat_member
    • Group chats linked to any team they belong to (member or leader)
    """
    # --- Direct / explicit memberships ---
    direct_chats = (
        db.query(models.Chat)
        .options(joinedload(models.Chat.members), joinedload(models.Chat.team))
        .join(models.chat_members)
        .filter(models.chat_members.c.user_id == current_user.id)
        .all()
    )

    # --- Team group chats ---
    user_team_ids = [t.id for t in current_user.teams] + [t.id for t in current_user.led_teams]
    team_chats = []
    if user_team_ids:
        team_chats = (
            db.query(models.Chat)
            .options(joinedload(models.Chat.members), joinedload(models.Chat.team))
            .filter(
                models.Chat.is_group == True,
                models.Chat.team_id.in_(user_team_ids),
            )
            .all()
        )

    all_chats = {c.id: c for c in direct_chats + team_chats}
    return [_resolve_chat(c) for c in all_chats.values()]


@router.post("/", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
def create_chat(
    chat_req: ChatCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Creates a new chat room — or returns an existing one (idempotent).

    • is_group=True  + team_id         → team group channel (one per team)
    • is_group=False + target_user_id  → DM between current user and target
    """
    if chat_req.is_group:
        if not chat_req.team_id:
            raise HTTPException(status_code=400, detail="team_id is required for group chats.")

        # Idempotent: return existing team channel if it exists
        existing = _load_chat(
            db,
            db.query(models.Chat.id)
            .filter(models.Chat.is_group == True, models.Chat.team_id == chat_req.team_id)
            .scalar()
            or UUID("00000000-0000-0000-0000-000000000000"),  # dummy — will be None
        ) if db.query(models.Chat.id).filter(
            models.Chat.is_group == True, models.Chat.team_id == chat_req.team_id
        ).scalar() else None

        if existing:
            return _resolve_chat(existing)

        team = db.query(models.Team).filter(models.Team.id == chat_req.team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found.")
        if (
            team.branch_id != current_user.branch_id
            and current_user.role != models.UserRole.SYSTEM_ADMIN
        ):
            raise HTTPException(status_code=403, detail="Cannot create a chat for a team outside your branch.")

        new_chat = models.Chat(is_group=True, team_id=chat_req.team_id)
        if current_user not in new_chat.members:
            new_chat.members.append(current_user)

    else:
        if not chat_req.target_user_id:
            raise HTTPException(status_code=400, detail="target_user_id is required for DMs.")

        target = db.query(models.User).filter(models.User.id == chat_req.target_user_id).first()
        if not target:
            raise HTTPException(status_code=404, detail="Target user not found.")

        if (
            target.branch_id != current_user.branch_id
            and current_user.role != models.UserRole.SYSTEM_ADMIN
        ):
            raise HTTPException(status_code=403, detail="Users must be in the same branch to DM.")

        # Idempotent: check whether a DM between these two users already exists
        existing_dms = (
            db.query(models.Chat)
            .options(joinedload(models.Chat.members))
            .join(models.chat_members)
            .filter(
                models.Chat.is_group == False,
                models.chat_members.c.user_id == current_user.id,
            )
            .all()
        )
        for c in existing_dms:
            member_ids = {m.id for m in c.members}
            if target.id in member_ids and len(member_ids) <= 2:
                return _resolve_chat(c)

        new_chat = models.Chat(is_group=False)
        new_chat.members.append(current_user)
        if target.id != current_user.id:
            new_chat.members.append(target)

    db.add(new_chat)
    db.commit()

    # Re-load with relationships for clean serialisation
    saved = _load_chat(db, new_chat.id)
    return _resolve_chat(saved)


@router.get("/{chat_id}/messages", response_model=List[ChatMessageResponse])
def get_chat_messages(
    chat_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Returns message history for a chat thread in chronological ascending order.
    The frontend receives the oldest message first (index 0) and newest last,
    matching natural top-to-bottom conversation display.
    """
    chat = _load_chat(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    if not _check_chat_access(chat, current_user):
        raise HTTPException(status_code=403, detail="Not authorised to view this chat.")

    messages = (
        db.query(models.ChatMessage)
        .options(joinedload(models.ChatMessage.sender))
        .filter(models.ChatMessage.chat_id == chat_id)
        .order_by(models.ChatMessage.created_at.asc())   # ascending — oldest first
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [_resolve_message(m) for m in messages]


@router.post("/{chat_id}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def send_chat_message(
    chat_id: UUID,
    message: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Persists a new message from the authenticated user into the specified chat thread.
    Returns the full ChatMessageResponse including sender_name and sender_role.
    """
    if not message.content or not message.content.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")

    chat = _load_chat(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    if not _check_chat_access(chat, current_user):
        raise HTTPException(status_code=403, detail="Not authorised to post in this chat.")

    new_msg = models.ChatMessage(
        chat_id=chat_id,
        sender_id=current_user.id,
        content=message.content.strip(),
    )
    db.add(new_msg)
    db.commit()

    # Re-load with sender joined so _resolve_message can read .sender.name
    saved = (
        db.query(models.ChatMessage)
        .options(joinedload(models.ChatMessage.sender))
        .filter(models.ChatMessage.id == new_msg.id)
        .first()
    )
    return _resolve_message(saved)
