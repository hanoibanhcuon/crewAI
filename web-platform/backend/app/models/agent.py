"""
Agent model.
"""
from sqlalchemy import Column, String, Boolean, Text, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Agent(BaseModel):
    """AI Agent model."""

    __tablename__ = "agents"

    # Basic Info
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Core Configuration (from CrewAI)
    role = Column(Text, nullable=False)
    goal = Column(Text, nullable=False)
    backstory = Column(Text, nullable=True)

    # LLM Configuration
    llm_provider = Column(String(50), default="openai")  # openai, anthropic, google, etc.
    llm_model = Column(String(100), default="gpt-4")
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, nullable=True)

    # Behavior Settings
    verbose = Column(Boolean, default=True)
    allow_delegation = Column(Boolean, default=False)
    max_iter = Column(Integer, default=25)
    max_rpm = Column(Integer, nullable=True)
    max_retry_limit = Column(Integer, default=2)

    # Memory Settings
    memory_enabled = Column(Boolean, default=True)
    memory_type = Column(String(50), default="short_term")  # short_term, long_term, entity

    # Knowledge Sources
    knowledge_sources = Column(JSONB, default=list)  # List of knowledge source configs

    # Code Execution
    allow_code_execution = Column(Boolean, default=False)
    code_execution_mode = Column(String(20), default="safe")  # safe, unsafe

    # Guardrails
    guardrail_config = Column(JSONB, nullable=True)

    # Custom Prompts
    system_prompt = Column(Text, nullable=True)

    # Ownership
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=False)

    # Tags
    tags = Column(ARRAY(String), default=list)

    # Relationships
    owner = relationship("User", back_populates="agents")
    tools = relationship("AgentTool", back_populates="agent")
    crew_agents = relationship("CrewAgent", back_populates="agent")


class AgentTool(BaseModel):
    """Agent-Tool association model."""

    __tablename__ = "agent_tools"

    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    tool_id = Column(UUID(as_uuid=True), ForeignKey("tools.id"), nullable=False)

    # Tool-specific configuration
    config = Column(JSONB, default=dict)
    is_enabled = Column(Boolean, default=True)

    # Relationships
    agent = relationship("Agent", back_populates="tools")
    tool = relationship("Tool", back_populates="agent_tools")
