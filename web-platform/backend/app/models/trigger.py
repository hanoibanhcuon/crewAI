"""
Trigger and Webhook models.
"""
from sqlalchemy import Column, String, Boolean, Text, ForeignKey, DateTime, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class TriggerType(str, enum.Enum):
    """Trigger types."""
    WEBHOOK = "webhook"
    SCHEDULE = "schedule"
    EMAIL = "email"
    SLACK = "slack"
    GITHUB = "github"
    CUSTOM = "custom"


class Trigger(BaseModel):
    """Trigger model."""

    __tablename__ = "triggers"

    # Basic Info
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    trigger_type = Column(SQLEnum(TriggerType), nullable=False)

    # Target
    target_type = Column(String(20), nullable=False)  # crew, flow
    crew_id = Column(UUID(as_uuid=True), ForeignKey("crews.id"), nullable=True)
    flow_id = Column(UUID(as_uuid=True), ForeignKey("flows.id"), nullable=True)

    # Configuration
    config = Column(JSONB, default=dict)
    # For WEBHOOK: {"secret": "..."}
    # For SCHEDULE: {"cron": "0 9 * * *", "timezone": "UTC"}
    # For EMAIL: {"email_address": "...", "filter": {...}}
    # For SLACK: {"channel": "...", "keywords": [...]}

    # Input Mapping
    input_mapping = Column(JSONB, default=dict)  # Map trigger payload to crew/flow inputs

    # Status
    is_active = Column(Boolean, default=True)
    last_triggered_at = Column(DateTime, nullable=True)
    trigger_count = Column(Integer, default=0)

    # Ownership
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)

    # Relationships
    crew = relationship("Crew")
    webhooks = relationship("Webhook", back_populates="trigger")


class Webhook(BaseModel):
    """Webhook model for trigger callbacks."""

    __tablename__ = "webhooks"

    trigger_id = Column(UUID(as_uuid=True), ForeignKey("triggers.id"), nullable=False)

    # Webhook URL
    url = Column(String(1000), nullable=False)
    secret = Column(String(255), nullable=True)

    # Headers
    headers = Column(JSONB, default=dict)

    # Events to send
    events = Column(ARRAY(String), default=list)  # execution_started, execution_completed, etc.

    # Status
    is_active = Column(Boolean, default=True)
    last_sent_at = Column(DateTime, nullable=True)
    failure_count = Column(Integer, default=0)

    # Relationships
    trigger = relationship("Trigger", back_populates="webhooks")
