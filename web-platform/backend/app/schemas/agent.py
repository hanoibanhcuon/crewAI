"""
Agent schemas.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class AgentBase(BaseModel):
    """Base agent schema."""
    name: str
    description: Optional[str] = None
    role: str
    goal: str
    backstory: Optional[str] = None


class AgentCreate(AgentBase):
    """Agent creation schema."""
    # LLM Configuration
    llm_provider: str = "openai"
    llm_model: str = "gpt-4"
    temperature: float = Field(0.7, ge=0, le=2)
    max_tokens: Optional[int] = None

    # Behavior Settings
    verbose: bool = True
    allow_delegation: bool = False
    max_iter: int = 25
    max_rpm: Optional[int] = None
    max_retry_limit: int = 2

    # Memory Settings
    memory_enabled: bool = True
    memory_type: str = "short_term"

    # Knowledge Sources
    knowledge_sources: List[Dict[str, Any]] = []

    # Code Execution
    allow_code_execution: bool = False
    code_execution_mode: str = "safe"

    # Guardrails
    guardrail_config: Optional[Dict[str, Any]] = None

    # Custom Prompts
    system_prompt: Optional[str] = None

    # Tools
    tool_ids: List[UUID] = []

    # Team
    team_id: Optional[UUID] = None

    # Visibility
    is_public: bool = False

    # Tags
    tags: List[str] = []


class AgentUpdate(BaseModel):
    """Agent update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    role: Optional[str] = None
    goal: Optional[str] = None
    backstory: Optional[str] = None

    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None

    verbose: Optional[bool] = None
    allow_delegation: Optional[bool] = None
    max_iter: Optional[int] = None
    max_rpm: Optional[int] = None
    max_retry_limit: Optional[int] = None

    memory_enabled: Optional[bool] = None
    memory_type: Optional[str] = None

    knowledge_sources: Optional[List[Dict[str, Any]]] = None

    allow_code_execution: Optional[bool] = None
    code_execution_mode: Optional[str] = None

    guardrail_config: Optional[Dict[str, Any]] = None
    system_prompt: Optional[str] = None

    tool_ids: Optional[List[UUID]] = None

    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class AgentToolResponse(BaseModel):
    """Agent tool response schema."""
    id: UUID
    tool_id: UUID
    tool_name: str
    tool_description: str
    config: Dict[str, Any] = {}
    is_enabled: bool

    class Config:
        from_attributes = True


class AgentResponse(AgentBase):
    """Agent response schema."""
    id: UUID
    llm_provider: str
    llm_model: str
    temperature: float
    max_tokens: Optional[int]

    verbose: bool
    allow_delegation: bool
    max_iter: int
    max_rpm: Optional[int]
    max_retry_limit: int

    memory_enabled: bool
    memory_type: str

    knowledge_sources: List[Dict[str, Any]]

    allow_code_execution: bool
    code_execution_mode: str

    guardrail_config: Optional[Dict[str, Any]]
    system_prompt: Optional[str]

    owner_id: UUID
    team_id: Optional[UUID]

    is_active: bool
    is_public: bool
    tags: List[str]

    tools: List[AgentToolResponse] = []

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentListResponse(BaseModel):
    """Agent list response schema."""
    items: List[AgentResponse]
    total: int
    page: int
    page_size: int
    pages: int
