"""
Flow schemas.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel


class FlowBase(BaseModel):
    """Base flow schema."""
    name: str
    description: Optional[str] = None


class FlowStepCreate(BaseModel):
    """Flow step creation schema."""
    name: str
    description: Optional[str] = None
    step_type: str  # start, listen, router, crew, function, human_feedback, end

    position_x: float = 0
    position_y: float = 0

    config: Dict[str, Any] = {}
    crew_id: Optional[UUID] = None

    order: int = 0


class FlowStepUpdate(BaseModel):
    """Flow step update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    step_type: Optional[str] = None

    position_x: Optional[float] = None
    position_y: Optional[float] = None

    config: Optional[Dict[str, Any]] = None
    crew_id: Optional[UUID] = None

    order: Optional[int] = None


class FlowConnectionCreate(BaseModel):
    """Flow connection creation schema."""
    source_step_id: UUID
    target_step_id: UUID

    connection_type: str = "normal"  # normal, or, and, conditional

    condition: Optional[str] = None
    route_name: Optional[str] = None
    label: Optional[str] = None


class FlowCreate(FlowBase):
    """Flow creation schema."""
    # State Configuration
    state_schema: Optional[Dict[str, Any]] = None

    # Persistence
    persistence_enabled: bool = False
    persistence_type: str = "sqlite"

    # Streaming
    stream: bool = False

    # Steps and Connections
    steps: List[FlowStepCreate] = []
    connections: List[FlowConnectionCreate] = []

    # Team
    team_id: Optional[UUID] = None

    # Visibility
    is_public: bool = False

    # Tags
    tags: List[str] = []


class FlowUpdate(BaseModel):
    """Flow update schema."""
    name: Optional[str] = None
    description: Optional[str] = None

    state_schema: Optional[Dict[str, Any]] = None

    persistence_enabled: Optional[bool] = None
    persistence_type: Optional[str] = None

    stream: Optional[bool] = None

    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    is_deployed: Optional[bool] = None

    deployment_config: Optional[Dict[str, Any]] = None
    environment: Optional[str] = None

    tags: Optional[List[str]] = None


class FlowStepResponse(BaseModel):
    """Flow step response schema."""
    id: UUID
    flow_id: UUID
    name: str
    description: Optional[str]
    step_type: str

    position_x: float
    position_y: float

    config: Dict[str, Any]
    crew_id: Optional[UUID]

    order: int

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FlowConnectionResponse(BaseModel):
    """Flow connection response schema."""
    id: UUID
    flow_id: UUID

    source_step_id: UUID
    target_step_id: UUID

    connection_type: str

    condition: Optional[str]
    route_name: Optional[str]
    label: Optional[str]

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FlowResponse(FlowBase):
    """Flow response schema."""
    id: UUID

    state_schema: Optional[Dict[str, Any]]

    persistence_enabled: bool
    persistence_type: str

    stream: bool

    owner_id: UUID
    team_id: Optional[UUID]

    is_active: bool
    is_public: bool
    is_deployed: bool

    deployment_config: Dict[str, Any]
    environment: str

    tags: List[str]

    steps: List[FlowStepResponse] = []
    connections: List[FlowConnectionResponse] = []

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FlowListResponse(BaseModel):
    """Flow list response schema."""
    items: List[FlowResponse]
    total: int
    page: int
    page_size: int
    pages: int


class FlowKickoffRequest(BaseModel):
    """Flow kickoff request schema."""
    inputs: Dict[str, Any] = {}
    initial_state: Dict[str, Any] = {}
    async_execution: bool = False


class FlowKickoffResponse(BaseModel):
    """Flow kickoff response schema."""
    execution_id: UUID
    status: str
    message: str
