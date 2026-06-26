from enum import Enum
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

class Role(str, Enum):
    EMPLOYEE = "Employee"
    TEAM_LEADER = "Team Leader"
    BRANCH_MANAGER = "Branch Manager"
    BRANCH_ADMIN = "Branch Admin"
    AUDITOR = "Auditor"
    SYSTEM_ADMIN = "System Admin"

class TaskStatus(str, Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class Priority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class BranchBase(BaseModel):
    name: str
    code: str
    manager_id: Optional[UUID] = None

class BranchCreate(BranchBase):
    pass

class Branch(BranchBase):
    id: UUID

    class Config:
        orm_mode = True
        from_attributes = True

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Role
    branch_id: Optional[UUID] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: UUID

    class Config:
        orm_mode = True
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[Role] = None
    branch_id: Optional[str] = None

class RequestAccessCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    branch_code: str
