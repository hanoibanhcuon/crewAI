"""
Agent service - business logic for agent operations.
"""
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.agent import Agent, AgentTool
from app.schemas.agent import AgentCreate, AgentUpdate


async def get_agents(
    db: AsyncSession,
    owner_id: UUID,
    team_id: Optional[UUID] = None,
    search: Optional[str] = None,
    include_public: bool = True,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[Agent], int]:
    """Get agents with pagination."""
    query = select(Agent).options(selectinload(Agent.tools))

    # Build where clause
    conditions = [Agent.owner_id == owner_id]
    if team_id:
        conditions.append(Agent.team_id == team_id)
    if include_public:
        conditions = [or_(Agent.owner_id == owner_id, Agent.is_public == True)]
    if search:
        conditions.append(
            or_(
                Agent.name.ilike(f"%{search}%"),
                Agent.role.ilike(f"%{search}%"),
            )
        )

    query = query.where(*conditions)

    # Count total
    count_query = select(func.count(Agent.id)).where(*conditions)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Paginate
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)

    return result.scalars().all(), total


async def get_agent(db: AsyncSession, agent_id: UUID, user_id: UUID) -> Optional[Agent]:
    """Get agent by ID."""
    result = await db.execute(
        select(Agent)
        .options(selectinload(Agent.tools))
        .where(
            Agent.id == agent_id,
            or_(Agent.owner_id == user_id, Agent.is_public == True)
        )
    )
    return result.scalar_one_or_none()


async def create_agent(db: AsyncSession, agent_data: AgentCreate, owner_id: UUID) -> Agent:
    """Create a new agent."""
    agent = Agent(
        name=agent_data.name,
        description=agent_data.description,
        role=agent_data.role,
        goal=agent_data.goal,
        backstory=agent_data.backstory,
        llm_provider=agent_data.llm_provider,
        llm_model=agent_data.llm_model,
        temperature=agent_data.temperature,
        max_tokens=agent_data.max_tokens,
        verbose=agent_data.verbose,
        allow_delegation=agent_data.allow_delegation,
        max_iter=agent_data.max_iter,
        max_rpm=agent_data.max_rpm,
        max_retry_limit=agent_data.max_retry_limit,
        memory_enabled=agent_data.memory_enabled,
        memory_type=agent_data.memory_type,
        knowledge_sources=agent_data.knowledge_sources,
        allow_code_execution=agent_data.allow_code_execution,
        code_execution_mode=agent_data.code_execution_mode,
        guardrail_config=agent_data.guardrail_config,
        system_prompt=agent_data.system_prompt,
        owner_id=owner_id,
        team_id=agent_data.team_id,
        is_public=agent_data.is_public,
        tags=agent_data.tags,
    )
    db.add(agent)
    await db.flush()

    # Add tools
    for tool_id in agent_data.tool_ids:
        agent_tool = AgentTool(agent_id=agent.id, tool_id=tool_id)
        db.add(agent_tool)

    await db.commit()
    await db.refresh(agent)
    return agent


async def update_agent(
    db: AsyncSession, agent_id: UUID, agent_data: AgentUpdate, user_id: UUID
) -> Optional[Agent]:
    """Update agent."""
    agent = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.owner_id == user_id)
    )
    agent = agent.scalar_one_or_none()
    if not agent:
        return None

    update_data = agent_data.model_dump(exclude_unset=True, exclude={"tool_ids"})
    for field, value in update_data.items():
        setattr(agent, field, value)

    # Update tools if provided
    if agent_data.tool_ids is not None:
        # Remove existing tools
        await db.execute(
            AgentTool.__table__.delete().where(AgentTool.agent_id == agent_id)
        )
        # Add new tools
        for tool_id in agent_data.tool_ids:
            agent_tool = AgentTool(agent_id=agent.id, tool_id=tool_id)
            db.add(agent_tool)

    await db.commit()
    await db.refresh(agent)
    return agent


async def delete_agent(db: AsyncSession, agent_id: UUID, user_id: UUID) -> bool:
    """Delete agent."""
    agent = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.owner_id == user_id)
    )
    agent = agent.scalar_one_or_none()
    if not agent:
        return False

    await db.delete(agent)
    await db.commit()
    return True


async def duplicate_agent(db: AsyncSession, agent_id: UUID, user_id: UUID) -> Optional[Agent]:
    """Duplicate an agent."""
    original = await get_agent(db, agent_id, user_id)
    if not original:
        return None

    new_agent = Agent(
        name=f"{original.name} (Copy)",
        description=original.description,
        role=original.role,
        goal=original.goal,
        backstory=original.backstory,
        llm_provider=original.llm_provider,
        llm_model=original.llm_model,
        temperature=original.temperature,
        max_tokens=original.max_tokens,
        verbose=original.verbose,
        allow_delegation=original.allow_delegation,
        max_iter=original.max_iter,
        max_rpm=original.max_rpm,
        max_retry_limit=original.max_retry_limit,
        memory_enabled=original.memory_enabled,
        memory_type=original.memory_type,
        knowledge_sources=original.knowledge_sources,
        allow_code_execution=original.allow_code_execution,
        code_execution_mode=original.code_execution_mode,
        guardrail_config=original.guardrail_config,
        system_prompt=original.system_prompt,
        owner_id=user_id,
        team_id=original.team_id if original.owner_id == user_id else None,
        is_public=False,
        tags=original.tags,
    )
    db.add(new_agent)
    await db.flush()

    # Copy tools
    for tool in original.tools:
        agent_tool = AgentTool(agent_id=new_agent.id, tool_id=tool.tool_id)
        db.add(agent_tool)

    await db.commit()
    await db.refresh(new_agent)
    return new_agent
