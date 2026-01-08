"""
Tool model.
"""
from sqlalchemy import Column, String, Boolean, Text, ForeignKey, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class ToolType(str, enum.Enum):
    """Tool types."""
    BUILTIN = "builtin"
    CUSTOM = "custom"
    MCP = "mcp"
    LANGCHAIN = "langchain"


class ToolCategory(BaseModel):
    """Tool category model."""

    __tablename__ = "tool_categories"

    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    order = Column(Integer, default=0)

    # Relationships
    tools = relationship("Tool", back_populates="category")


class Tool(BaseModel):
    """Tool model."""

    __tablename__ = "tools"

    # Basic Info
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    tool_type = Column(SQLEnum(ToolType), default=ToolType.BUILTIN)

    # Category
    category_id = Column(UUID(as_uuid=True), ForeignKey("tool_categories.id"), nullable=True)

    # Implementation
    module_path = Column(String(500), nullable=True)  # e.g., "crewai_tools.SerperDevTool"
    class_name = Column(String(100), nullable=True)

    # Custom Code (for custom tools)
    custom_code = Column(Text, nullable=True)

    # Arguments Schema (Pydantic model)
    args_schema = Column(JSONB, nullable=True)

    # Environment Variables Required
    env_vars = Column(ARRAY(String), default=list)  # e.g., ["SERPER_API_KEY"]

    # Configuration
    default_config = Column(JSONB, default=dict)

    # Cache
    cache_enabled = Column(Boolean, default=True)
    cache_function = Column(Text, nullable=True)

    # Usage Limits
    max_usage_count = Column(Integer, nullable=True)

    # Result handling
    result_as_answer = Column(Boolean, default=False)

    # Icon and UI
    icon = Column(String(50), nullable=True)
    color = Column(String(20), nullable=True)

    # Ownership
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Null for built-in
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)
    is_builtin = Column(Boolean, default=False)

    # Tags
    tags = Column(ARRAY(String), default=list)

    # Relationships
    category = relationship("ToolCategory", back_populates="tools")
    agent_tools = relationship("AgentTool", back_populates="tool")
