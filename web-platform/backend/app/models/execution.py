"""
Execution and Trace models.
"""
from sqlalchemy import Column, String, Boolean, Text, ForeignKey, Integer, Float, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class ExecutionStatus(str, enum.Enum):
    """Execution status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    WAITING_HUMAN = "waiting_human"


class LogLevel(str, enum.Enum):
    """Log levels."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class Execution(BaseModel):
    """Execution model - tracks crew/flow runs."""

    __tablename__ = "executions"

    # Type
    execution_type = Column(String(20), nullable=False)  # crew, flow

    # Reference
    crew_id = Column(UUID(as_uuid=True), ForeignKey("crews.id"), nullable=True)
    flow_id = Column(UUID(as_uuid=True), ForeignKey("flows.id"), nullable=True)

    # Status
    status = Column(SQLEnum(ExecutionStatus), default=ExecutionStatus.PENDING)

    # Input/Output
    inputs = Column(JSONB, default=dict)
    outputs = Column(JSONB, nullable=True)
    error = Column(Text, nullable=True)

    # Metrics
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)

    # Token Usage
    total_tokens = Column(Integer, default=0)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)

    # Cost
    estimated_cost = Column(Float, default=0.0)

    # Trigger
    trigger_type = Column(String(50), nullable=True)  # manual, webhook, schedule, etc.
    trigger_id = Column(UUID(as_uuid=True), ForeignKey("triggers.id"), nullable=True)

    # User who triggered
    triggered_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Environment
    environment = Column(String(50), default="development")

    # Relationships
    crew = relationship("Crew", back_populates="executions")
    logs = relationship("ExecutionLog", back_populates="execution")
    traces = relationship("Trace", back_populates="execution")


class ExecutionLog(BaseModel):
    """Execution log entry."""

    __tablename__ = "execution_logs"

    execution_id = Column(UUID(as_uuid=True), ForeignKey("executions.id"), nullable=False)

    # Log Info
    level = Column(SQLEnum(LogLevel), default=LogLevel.INFO)
    message = Column(Text, nullable=False)
    data = Column(JSONB, nullable=True)

    # Source
    source = Column(String(100), nullable=True)  # agent name, task name, etc.
    source_type = Column(String(50), nullable=True)  # agent, task, tool, etc.

    # Timestamp
    timestamp = Column(DateTime, nullable=False)

    # Relationships
    execution = relationship("Execution", back_populates="logs")


class Trace(BaseModel):
    """Trace model for observability."""

    __tablename__ = "traces"

    execution_id = Column(UUID(as_uuid=True), ForeignKey("executions.id"), nullable=False)

    # Trace Info
    trace_id = Column(String(100), nullable=False, index=True)
    span_id = Column(String(100), nullable=False)
    parent_span_id = Column(String(100), nullable=True)

    # Operation
    operation_name = Column(String(255), nullable=False)
    operation_type = Column(String(50), nullable=True)  # llm_call, tool_call, agent_action, etc.

    # Timing
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)

    # Status
    status = Column(String(20), default="ok")  # ok, error
    error = Column(Text, nullable=True)

    # Attributes
    attributes = Column(JSONB, default=dict)

    # LLM-specific
    llm_model = Column(String(100), nullable=True)
    llm_provider = Column(String(50), nullable=True)
    prompt = Column(Text, nullable=True)
    response = Column(Text, nullable=True)
    tokens_used = Column(Integer, nullable=True)

    # Relationships
    execution = relationship("Execution", back_populates="traces")
