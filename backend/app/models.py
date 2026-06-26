import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Date, Enum, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base

class UserRole(str, enum.Enum):
    EMPLOYEE = "Employee"
    TEAM_LEADER = "Team Leader"
    BRANCH_MANAGER = "Branch Manager"
    BRANCH_ADMIN = "Branch Admin"
    AUDITOR = "Auditor"
    SYSTEM_ADMIN = "System Admin"

class TaskStatus(str, enum.Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class TaskPriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class TransferRequestStatus(str, enum.Enum):
    PENDING = "Pending"
    SOURCE_APPROVED = "Source Approved"
    COMPLETED = "Completed"
    DENIED = "Denied"

team_members = Table(
    "team_members",
    Base.metadata,
    Column("team_id", UUID(as_uuid=True), ForeignKey("teams.id"), primary_key=True),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
)

class Branch(Base):
    __tablename__ = "branches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id", use_alter=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    manager = relationship("User", foreign_keys=[manager_id], back_populates="managed_branches")
    users = relationship("User", foreign_keys="[User.branch_id]", back_populates="branch")
    teams = relationship("Team", back_populates="branch")
    tasks = relationship("Task", back_populates="branch")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    branch_id = Column(UUID(as_uuid=True), ForeignKey("branches.id"), nullable=True)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    branch = relationship("Branch", foreign_keys=[branch_id], back_populates="users")
    managed_branches = relationship("Branch", foreign_keys="[Branch.manager_id]", back_populates="manager")
    
    led_teams = relationship("Team", back_populates="leader")
    teams = relationship("Team", secondary=team_members, back_populates="members")
    assigned_tasks = relationship("Task", foreign_keys="[Task.assigned_to_user]", back_populates="assigned_user")


class Team(Base):
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    branch_id = Column(UUID(as_uuid=True), ForeignKey("branches.id"), nullable=False)
    leader_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    branch = relationship("Branch", back_populates="teams")
    leader = relationship("User", back_populates="led_teams")
    members = relationship("User", secondary=team_members, back_populates="teams")
    tasks = relationship("Task", foreign_keys="[Task.assigned_to_team]", back_populates="assigned_team")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    assigned_to_user = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_to_team = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    branch_id = Column(UUID(as_uuid=True), ForeignKey("branches.id"), nullable=False)
    regulation_id = Column(UUID(as_uuid=True), ForeignKey("regulations.id", ondelete="SET NULL"), nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False)
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assigned_user = relationship("User", foreign_keys=[assigned_to_user], back_populates="assigned_tasks")
    assigned_team = relationship("Team", foreign_keys=[assigned_to_team], back_populates="tasks")
    branch = relationship("Branch", foreign_keys=[branch_id], back_populates="tasks")
    regulation = relationship("Regulation")

class TransferRequest(Base):
    __tablename__ = "transfer_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    from_branch_id = Column(UUID(as_uuid=True), ForeignKey("branches.id"), nullable=False)
    to_branch_id = Column(UUID(as_uuid=True), ForeignKey("branches.id"), nullable=False)
    status = Column(Enum(TransferRequestStatus), default=TransferRequestStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    from_branch = relationship("Branch", foreign_keys=[from_branch_id])
    to_branch = relationship("Branch", foreign_keys=[to_branch_id])

chat_members = Table(
    "chat_members",
    Base.metadata,
    Column("chat_id", UUID(as_uuid=True), ForeignKey("chats.id"), primary_key=True),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
)

class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    is_group = Column(Boolean, default=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team")
    members = relationship("User", secondary=chat_members)
    messages = relationship("ChatMessage", back_populates="chat")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    chat = relationship("Chat", back_populates="messages")
    sender = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class Regulation(Base):
    __tablename__ = "regulations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(String, default="PROCESSING")
    created_at = Column(DateTime, default=datetime.utcnow)

    uploader = relationship("User")

class DiscussionTopic(Base):
    __tablename__ = "discussion_topics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    branch_id = Column(UUID(as_uuid=True), ForeignKey("branches.id"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    branch = relationship("Branch")
    author = relationship("User")
    comments = relationship("DiscussionComment", back_populates="topic")

class DiscussionComment(Base):
    __tablename__ = "discussion_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("discussion_topics.id"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    topic = relationship("DiscussionTopic", back_populates="comments")
    author = relationship("User")
