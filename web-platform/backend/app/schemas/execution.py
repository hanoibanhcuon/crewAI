"""
Execution and Trace schemas.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel


class ExecutionBase(BaseModel):
    """Base execution schema."""
    execution_type: str  # crew, flow


class ExecutionResponse(ExecutionBase):
    """Execution response schema."""
    id: UUID

    crew_id: Optional[UUID]
    flow_id: Optional[UUID]

    status: str  # pending, running, completed, failed, cancelled, waiting_human

    inputs: Dict[str, Any]
    outputs: Optional[Dict[str, Any]]
    error: Optional[str]

    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_ms: Optional[int]

    total_tokens: int
    prompt_tokens: int
    completion_tokens: int

    estimated_cost: float

    trigger_type: Optional[str]
    trigger_id: Optional[UUID]
    triggered_by: Optional[UUID]

    environment: str

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExecutionListResponse(BaseModel):
    """Execution list response schema."""
    items: List[ExecutionResponse]
    total: int
    page: int
    page_size: int
    pages: int


class ExecutionLogResponse(BaseModel):
    """Execution log response schema."""
    id: UUID
    execution_id: UUID

    level: str
    message: str
    data: Optional[Dict[str, Any]]

    source: Optional[str]
    source_type: Optional[str]

    timestamp: datetime

    created_at: datetime

    class Config:
        from_attributes = True


class TraceResponse(BaseModel):
    """Trace response schema."""
    id: UUID
    execution_id: UUID

    trace_id: str
    span_id: str
    parent_span_id: Optional[str]

    operation_name: str
    operation_type: Optional[str]

    start_time: datetime
    end_time: Optional[datetime]
    duration_ms: Optional[int]

    status: str
    error: Optional[str]

    attributes: Dict[str, Any]

    llm_model: Optional[str]
    llm_provider: Optional[str]
    prompt: Optional[str]
    response: Optional[str]
    tokens_used: Optional[int]

    created_at: datetime

    class Config:
        from_attributes = True


class TraceListResponse(BaseModel):
    """Trace list response schema."""
    items: List[TraceResponse]
    total: int
