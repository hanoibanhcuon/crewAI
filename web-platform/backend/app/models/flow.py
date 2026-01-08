"""
Flow model for event-driven workflows.
"""
from sqlalchemy import Column, String, Boolean, Text, ForeignKey, Integer, Float, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class StepType(str, enum.Enum):
    """Flow step types."""
    START = "start"
    LISTEN = "listen"
    ROUTER = "router"
    CREW = "crew"
    FUNCTION = "function"
    HUMAN_FEEDBACK = "human_feedback"
    END = "end"


class ConnectionType(str, enum.Enum):
    """Flow connection types."""
    NORMAL = "normal"
    OR = "or"
    AND = "and"
    CONDITIONAL = "conditional"


class Flow(BaseModel):
    """Flow model - event-driven workflow orchestration."""

    __tablename__ = "flows"

    # Basic Info
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # State Configuration
    state_schema = Column(JSONB, nullable=True)  # Pydantic model schema for state

    # Persistence
    persistence_enabled = Column(Boolean, default=False)
    persistence_type = Column(String(50), default="sqlite")  # sqlite, redis, custom

    # Streaming
    stream = Column(Boolean, default=False)

    # Ownership
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=False)
    is_deployed = Column(Boolean, default=False)

    # Deployment
    deployment_config = Column(JSONB, default=dict)
    environment = Column(String(50), default="development")

    # Tags
    tags = Column(ARRAY(String), default=list)

    # Relationships
    owner = relationship("User", back_populates="flows")
    steps = relationship("FlowStep", back_populates="flow")
    connections = relationship("FlowConnection", back_populates="flow")


class FlowStep(BaseModel):
    """Flow step model."""

    __tablename__ = "flow_steps"

    flow_id = Column(UUID(as_uuid=True), ForeignKey("flows.id"), nullable=False)

    # Step Info
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    step_type = Column(SQLEnum(StepType), nullable=False)

    # Position (for visual editor)
    position_x = Column(Float, default=0)
    position_y = Column(Float, default=0)

    # Configuration based on step_type
    config = Column(JSONB, default=dict)
    # For CREW type: {"crew_id": "uuid"}
    # For FUNCTION type: {"code": "python code", "inputs": [...], "outputs": [...]}
    # For ROUTER type: {"conditions": [{"route": "name", "condition": "expression"}]}
    # For HUMAN_FEEDBACK type: {"prompt": "...", "options": [...]}

    # Crew reference (if step_type is CREW)
    crew_id = Column(UUID(as_uuid=True), ForeignKey("crews.id"), nullable=True)

    # Order (for sequential execution reference)
    order = Column(Integer, default=0)

    # Relationships
    flow = relationship("Flow", back_populates="steps")
    crew = relationship("Crew")
    outgoing_connections = relationship("FlowConnection", foreign_keys="FlowConnection.source_step_id", back_populates="source_step")
    incoming_connections = relationship("FlowConnection", foreign_keys="FlowConnection.target_step_id", back_populates="target_step")


class FlowConnection(BaseModel):
    """Flow connection model (edges between steps)."""

    __tablename__ = "flow_connections"

    flow_id = Column(UUID(as_uuid=True), ForeignKey("flows.id"), nullable=False)

    # Source and Target
    source_step_id = Column(UUID(as_uuid=True), ForeignKey("flow_steps.id"), nullable=False)
    target_step_id = Column(UUID(as_uuid=True), ForeignKey("flow_steps.id"), nullable=False)

    # Connection Type
    connection_type = Column(SQLEnum(ConnectionType), default=ConnectionType.NORMAL)

    # Conditional Configuration
    condition = Column(Text, nullable=True)  # Expression for conditional routing
    route_name = Column(String(100), nullable=True)  # Named route for router

    # Label (for display)
    label = Column(String(100), nullable=True)

    # Relationships
    flow = relationship("Flow", back_populates="connections")
    source_step = relationship("FlowStep", foreign_keys=[source_step_id], back_populates="outgoing_connections")
    target_step = relationship("FlowStep", foreign_keys=[target_step_id], back_populates="incoming_connections")
