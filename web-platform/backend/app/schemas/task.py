"""
Task schemas.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel


class TaskBase(BaseModel):
    """Base task schema."""
    name: str
    description: str
    expected_output: str


class TaskCreate(TaskBase):
    """Task creation schema."""
    agent_id: Optional[UUID] = None

    # Execution Settings
    async_execution: bool = False
    human_input: bool = False
    markdown: bool = False

    # Output Configuration
    output_file: Optional[str] = None
    output_json_schema: Optional[Dict[str, Any]] = None
    output_pydantic_model: Optional[str] = None
    create_directory: bool = False

    # Callback
    callback_url: Optional[str] = None

    # Guardrails
    guardrails: List[Dict[str, Any]] = []
    guardrail_max_retries: int = 0

    # Tools Override
    tools: List[UUID] = []

    # Dependencies (context)
    dependency_ids: List[UUID] = []

    # Team
    team_id: Optional[UUID] = None

    # Visibility
    is_public: bool = False

    # Tags
    tags: List[str] = []


class TaskUpdate(BaseModel):
    """Task update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    expected_output: Optional[str] = None
    agent_id: Optional[UUID] = None

    async_execution: Optional[bool] = None
    human_input: Optional[bool] = None
    markdown: Optional[bool] = None

    output_file: Optional[str] = None
    output_json_schema: Optional[Dict[str, Any]] = None
    output_pydantic_model: Optional[str] = None
    create_directory: Optional[bool] = None

    callback_url: Optional[str] = None

    guardrails: Optional[List[Dict[str, Any]]] = None
    guardrail_max_retries: Optional[int] = None

    tools: Optional[List[UUID]] = None
    dependency_ids: Optional[List[UUID]] = None

    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class TaskDependencyResponse(BaseModel):
    """Task dependency response schema."""
    id: UUID
    task_id: UUID
    depends_on_id: UUID
    depends_on_name: str

    class Config:
        from_attributes = True


class TaskResponse(TaskBase):
    """Task response schema."""
    id: UUID
    agent_id: Optional[UUID]

    async_execution: bool
    human_input: bool
    markdown: bool

    output_file: Optional[str]
    output_json_schema: Optional[Dict[str, Any]]
    output_pydantic_model: Optional[str]
    create_directory: bool

    callback_url: Optional[str]

    guardrails: List[Dict[str, Any]]
    guardrail_max_retries: int

    tools: List[UUID]

    owner_id: UUID
    team_id: Optional[UUID]

    is_active: bool
    is_public: bool
    tags: List[str]

    dependencies: List[TaskDependencyResponse] = []

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    """Task list response schema."""
    items: List[TaskResponse]
    total: int
    page: int
    page_size: int
    pages: int
