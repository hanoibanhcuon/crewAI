"""
User and Team models.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class UserRole(str, enum.Enum):
    """User roles for RBAC."""
    ADMIN = "admin"
    OWNER = "owner"
    MEMBER = "member"
    VIEWER = "viewer"


class User(BaseModel):
    """User model."""

    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role = Column(SQLEnum(UserRole), default=UserRole.MEMBER)

    # Settings
    settings = Column(JSONB, default=dict)

    # API Keys
    api_keys = Column(JSONB, default=dict)  # Encrypted LLM API keys

    # Relationships
    teams = relationship("TeamMember", back_populates="user")
    agents = relationship("Agent", back_populates="owner")
    crews = relationship("Crew", back_populates="owner")
    flows = relationship("Flow", back_populates="owner")
    knowledge_sources = relationship("KnowledgeSource", back_populates="user")

    # Timestamps
    last_login_at = Column(DateTime, nullable=True)
    email_verified_at = Column(DateTime, nullable=True)


class Team(BaseModel):
    """Team model for organization."""

    __tablename__ = "teams"

    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(String(1000), nullable=True)
    logo_url = Column(String(500), nullable=True)

    # Settings
    settings = Column(JSONB, default=dict)

    # Subscription
    plan = Column(String(50), default="free")  # free, pro, enterprise
    plan_expires_at = Column(DateTime, nullable=True)

    # Relationships
    members = relationship("TeamMember", back_populates="team")


class TeamMember(BaseModel):
    """Team membership model."""

    __tablename__ = "team_members"

    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.MEMBER)

    # Permissions
    can_create = Column(Boolean, default=True)
    can_edit = Column(Boolean, default=True)
    can_delete = Column(Boolean, default=False)
    can_deploy = Column(Boolean, default=False)

    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="teams")

    # Timestamps
    invited_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
