"""
Tool schemas.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel


class ToolBase(BaseModel):
    """Base tool schema."""
    name: str
    description: str


class ToolCreate(ToolBase):
    """Tool creation schema."""
    tool_type: str = "custom"  # builtin, custom, mcp, langchain

    category_id: Optional[UUID] = None

    # Implementation
    module_path: Optional[str] = None
    class_name: Optional[str] = None

    # Custom Code
    custom_code: Optional[str] = None

    # Arguments Schema
    args_schema: Optional[Dict[str, Any]] = None

    # Environment Variables Required
    env_vars: List[str] = []

    # Configuration
    default_config: Dict[str, Any] = {}

    # Cache
    cache_enabled: bool = True
    cache_function: Optional[str] = None

    # Usage Limits
    max_usage_count: Optional[int] = None

    # Result handling
    result_as_answer: bool = False

    # Icon and UI
    icon: Optional[str] = None
    color: Optional[str] = None

    # Team
    team_id: Optional[UUID] = None

    # Visibility
    is_public: bool = True

    # Tags
    tags: List[str] = []


class ToolUpdate(BaseModel):
    """Tool update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    tool_type: Optional[str] = None

    category_id: Optional[UUID] = None

    module_path: Optional[str] = None
    class_name: Optional[str] = None

    custom_code: Optional[str] = None

    args_schema: Optional[Dict[str, Any]] = None

    env_vars: Optional[List[str]] = None

    default_config: Optional[Dict[str, Any]] = None

    cache_enabled: Optional[bool] = None
    cache_function: Optional[str] = None

    max_usage_count: Optional[int] = None

    result_as_answer: Optional[bool] = None

    icon: Optional[str] = None
    color: Optional[str] = None

    is_active: Optional[bool] = None
    is_public: Optional[bool] = None

    tags: Optional[List[str]] = None


class ToolCategoryResponse(BaseModel):
    """Tool category response schema."""
    id: UUID
    name: str
    description: Optional[str]
    icon: Optional[str]
    order: int

    class Config:
        from_attributes = True


class ToolResponse(ToolBase):
    """Tool response schema."""
    id: UUID
    tool_type: str

    category_id: Optional[UUID]
    category: Optional[ToolCategoryResponse]

    module_path: Optional[str]
    class_name: Optional[str]

    custom_code: Optional[str]

    args_schema: Optional[Dict[str, Any]]

    env_vars: List[str]

    default_config: Dict[str, Any]

    cache_enabled: bool
    cache_function: Optional[str]

    max_usage_count: Optional[int]

    result_as_answer: bool

    icon: Optional[str]
    color: Optional[str]

    owner_id: Optional[UUID]
    team_id: Optional[UUID]

    is_active: bool
    is_public: bool
    is_builtin: bool

    tags: List[str]

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ToolListResponse(BaseModel):
    """Tool list response schema."""
    items: List[ToolResponse]
    total: int
    page: int
    page_size: int
    pages: int
