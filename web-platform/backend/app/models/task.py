"""
Task model.
"""
from sqlalchemy import Column, String, Boolean, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Task(BaseModel):
    """Task model."""

    __tablename__ = "tasks"

    # Basic Info
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)

    # Assigned Agent
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)

    # Execution Settings
    async_execution = Column(Boolean, default=False)
    human_input = Column(Boolean, default=False)
    markdown = Column(Boolean, default=False)

    # Output Configuration
    output_file = Column(String(500), nullable=True)
    output_json_schema = Column(JSONB, nullable=True)  # JSON schema for output
    output_pydantic_model = Column(String(255), nullable=True)  # Pydantic model name
    create_directory = Column(Boolean, default=False)

    # Callback
    callback_url = Column(String(500), nullable=True)

    # Guardrails
    guardrails = Column(JSONB, default=list)  # List of guardrail configs
    guardrail_max_retries = Column(Integer, default=0)

    # Tools Override
    tools = Column(JSONB, default=list)  # List of tool IDs specific to this task

    # Ownership
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=False)

    # Tags
    tags = Column(ARRAY(String), default=list)

    # Relationships
    agent = relationship("Agent")
    dependencies = relationship("TaskDependency", foreign_keys="TaskDependency.task_id", back_populates="task")
    dependents = relationship("TaskDependency", foreign_keys="TaskDependency.depends_on_id", back_populates="depends_on")
    crew_tasks = relationship("CrewTask", back_populates="task")


class TaskDependency(BaseModel):
    """Task dependency model (context)."""

    __tablename__ = "task_dependencies"

    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    depends_on_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)

    # Relationships
    task = relationship("Task", foreign_keys=[task_id], back_populates="dependencies")
    depends_on = relationship("Task", foreign_keys=[depends_on_id], back_populates="dependents")
