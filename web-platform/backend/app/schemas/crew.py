"""
Crew schemas.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel


class CrewBase(BaseModel):
    """Base crew schema."""
    name: str
    description: Optional[str] = None


class CrewAgentConfig(BaseModel):
    """Crew agent configuration."""
    agent_id: UUID
    order: int = 0
    config_override: Dict[str, Any] = {}


class CrewTaskConfig(BaseModel):
    """Crew task configuration."""
    task_id: UUID
    order: int = 0
    config_override: Dict[str, Any] = {}


class CrewCreate(CrewBase):
    """Crew creation schema."""
    # Process Configuration
    process: str = "sequential"  # sequential, hierarchical
    verbose: bool = True

    # Manager Agent (for hierarchical process)
    manager_agent_id: Optional[UUID] = None
    manager_llm: Optional[str] = None
    respect_context_window: bool = True

    # Memory Configuration
    memory_enabled: bool = False
    memory_config: Dict[str, Any] = {}

    # Knowledge
    knowledge_sources: List[Dict[str, Any]] = []

    # Embedder Configuration
    embedder_config: Dict[str, Any] = {}

    # Cache
    cache_enabled: bool = True

    # Rate Limiting
    max_rpm: Optional[int] = None

    # Execution Settings
    full_output: bool = False
    step_callback: Optional[str] = None
    task_callback: Optional[str] = None

    # Planning
    planning: bool = False
    planning_llm: Optional[str] = None

    # Streaming
    stream: bool = False

    # Output
    output_log_file: Optional[str] = None

    # Agents and Tasks
    agents: List[CrewAgentConfig] = []
    tasks: List[CrewTaskConfig] = []

    # Team
    team_id: Optional[UUID] = None

    # Visibility
    is_public: bool = False

    # Tags
    tags: List[str] = []


class CrewUpdate(BaseModel):
    """Crew update schema."""
    name: Optional[str] = None
    description: Optional[str] = None

    process: Optional[str] = None
    verbose: Optional[bool] = None

    manager_agent_id: Optional[UUID] = None
    manager_llm: Optional[str] = None
    respect_context_window: Optional[bool] = None

    memory_enabled: Optional[bool] = None
    memory_config: Optional[Dict[str, Any]] = None

    knowledge_sources: Optional[List[Dict[str, Any]]] = None

    embedder_config: Optional[Dict[str, Any]] = None

    cache_enabled: Optional[bool] = None

    max_rpm: Optional[int] = None

    full_output: Optional[bool] = None
    step_callback: Optional[str] = None
    task_callback: Optional[str] = None

    planning: Optional[bool] = None
    planning_llm: Optional[str] = None

    stream: Optional[bool] = None

    output_log_file: Optional[str] = None

    agents: Optional[List[CrewAgentConfig]] = None
    tasks: Optional[List[CrewTaskConfig]] = None

    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    is_deployed: Optional[bool] = None

    deployment_config: Optional[Dict[str, Any]] = None
    environment: Optional[str] = None

    tags: Optional[List[str]] = None


class CrewAgentResponse(BaseModel):
    """Crew agent response schema."""
    id: UUID
    agent_id: UUID
    agent_name: str
    agent_role: str
    order: int
    config_override: Dict[str, Any]

    class Config:
        from_attributes = True


class CrewTaskResponse(BaseModel):
    """Crew task response schema."""
    id: UUID
    task_id: UUID
    task_name: str
    task_description: str
    order: int
    config_override: Dict[str, Any]

    class Config:
        from_attributes = True


class CrewResponse(CrewBase):
    """Crew response schema."""
    id: UUID

    process: str
    verbose: bool

    manager_agent_id: Optional[UUID]
    manager_llm: Optional[str]
    respect_context_window: bool

    memory_enabled: bool
    memory_config: Dict[str, Any]

    knowledge_sources: List[Dict[str, Any]]

    embedder_config: Dict[str, Any]

    cache_enabled: bool

    max_rpm: Optional[int]

    full_output: bool
    step_callback: Optional[str]
    task_callback: Optional[str]

    planning: bool
    planning_llm: Optional[str]

    stream: bool

    output_log_file: Optional[str]

    owner_id: UUID
    team_id: Optional[UUID]

    is_active: bool
    is_public: bool
    is_deployed: bool

    deployment_config: Dict[str, Any]
    environment: str

    tags: List[str]

    agents: List[CrewAgentResponse] = []
    tasks: List[CrewTaskResponse] = []

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CrewListResponse(BaseModel):
    """Crew list response schema."""
    items: List[CrewResponse]
    total: int
    page: int
    page_size: int
    pages: int


class CrewKickoffRequest(BaseModel):
    """Crew kickoff request schema."""
    inputs: Dict[str, Any] = {}
    async_execution: bool = False


class CrewKickoffResponse(BaseModel):
    """Crew kickoff response schema."""
    execution_id: UUID
    status: str
    message: str
