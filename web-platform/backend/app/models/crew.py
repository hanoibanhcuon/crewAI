"""
Crew model.
"""
from sqlalchemy import Column, String, Boolean, Text, ForeignKey, Integer, Float, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class ProcessType(str, enum.Enum):
    """Crew process types."""
    SEQUENTIAL = "sequential"
    HIERARCHICAL = "hierarchical"


class Crew(BaseModel):
    """Crew model - orchestrates agents and tasks."""

    __tablename__ = "crews"

    # Basic Info
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Process Configuration
    process = Column(SQLEnum(ProcessType), default=ProcessType.SEQUENTIAL)
    verbose = Column(Boolean, default=True)

    # Manager Agent (for hierarchical process)
    manager_agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    manager_llm = Column(String(100), nullable=True)
    respect_context_window = Column(Boolean, default=True)

    # Memory Configuration
    memory_enabled = Column(Boolean, default=False)
    memory_config = Column(JSONB, default=dict)

    # Knowledge
    knowledge_sources = Column(JSONB, default=list)

    # Embedder Configuration
    embedder_config = Column(JSONB, default=dict)

    # Cache
    cache_enabled = Column(Boolean, default=True)

    # Rate Limiting
    max_rpm = Column(Integer, nullable=True)

    # Execution Settings
    full_output = Column(Boolean, default=False)
    step_callback = Column(String(500), nullable=True)
    task_callback = Column(String(500), nullable=True)

    # Planning
    planning = Column(Boolean, default=False)
    planning_llm = Column(String(100), nullable=True)

    # Streaming
    stream = Column(Boolean, default=False)

    # Output
    output_log_file = Column(String(500), nullable=True)

    # Ownership
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=False)
    is_deployed = Column(Boolean, default=False)

    # Deployment
    deployment_config = Column(JSONB, default=dict)
    environment = Column(String(50), default="development")  # development, staging, production

    # Tags
    tags = Column(ARRAY(String), default=list)

    # Relationships
    owner = relationship("User", back_populates="crews")
    manager_agent = relationship("Agent", foreign_keys=[manager_agent_id])
    agents = relationship("CrewAgent", back_populates="crew")
    tasks = relationship("CrewTask", back_populates="crew")
    executions = relationship("Execution", back_populates="crew")


class CrewAgent(BaseModel):
    """Crew-Agent association model."""

    __tablename__ = "crew_agents"

    crew_id = Column(UUID(as_uuid=True), ForeignKey("crews.id"), nullable=False)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)

    # Order in crew
    order = Column(Integer, default=0)

    # Agent-specific config overrides
    config_override = Column(JSONB, default=dict)

    # Relationships
    crew = relationship("Crew", back_populates="agents")
    agent = relationship("Agent", back_populates="crew_agents")


class CrewTask(BaseModel):
    """Crew-Task association model."""

    __tablename__ = "crew_tasks"

    crew_id = Column(UUID(as_uuid=True), ForeignKey("crews.id"), nullable=False)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)

    # Order in crew
    order = Column(Integer, default=0)

    # Task-specific config overrides
    config_override = Column(JSONB, default=dict)

    # Relationships
    crew = relationship("Crew", back_populates="tasks")
    task = relationship("Task", back_populates="crew_tasks")
