"""
User and Team schemas.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


# ============== User Schemas ==============

class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """User update schema."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class UserResponse(UserBase):
    """User response schema."""
    id: UUID
    avatar_url: Optional[str] = None
    is_active: bool
    role: str
    settings: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """JWT Token schema."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class PasswordChange(BaseModel):
    """Password change schema."""
    current_password: str
    new_password: str = Field(..., min_length=8)


class APIKeyCreate(BaseModel):
    """API Key creation schema."""
    provider: str  # openai, anthropic, google, etc.
    api_key: str


class APIKeyResponse(BaseModel):
    """API Key response schema."""
    provider: str
    is_set: bool
    last_updated: Optional[datetime] = None


# ============== Team Schemas ==============

class TeamBase(BaseModel):
    """Base team schema."""
    name: str
    description: Optional[str] = None


class TeamCreate(TeamBase):
    """Team creation schema."""
    pass


class TeamUpdate(BaseModel):
    """Team update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class TeamMemberResponse(BaseModel):
    """Team member response schema."""
    id: UUID
    user_id: UUID
    user_email: str
    user_name: Optional[str]
    role: str
    can_create: bool
    can_edit: bool
    can_delete: bool
    can_deploy: bool
    accepted_at: Optional[datetime]

    class Config:
        from_attributes = True


class TeamResponse(TeamBase):
    """Team response schema."""
    id: UUID
    slug: str
    logo_url: Optional[str] = None
    plan: str
    plan_expires_at: Optional[datetime] = None
    members: List[TeamMemberResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TeamInvite(BaseModel):
    """Team invite schema."""
    email: EmailStr
    role: str = "member"
    can_create: bool = True
    can_edit: bool = True
    can_delete: bool = False
    can_deploy: bool = False
