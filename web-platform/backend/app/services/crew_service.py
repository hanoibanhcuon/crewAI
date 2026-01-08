"""
Crew service - business logic for crew operations.
"""
from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID
import re
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.crew import Crew, CrewAgent, CrewTask
from app.models.agent import Agent
from app.models.task import Task
from app.schemas.crew import CrewCreate, CrewUpdate


async def get_crews(
    db: AsyncSession,
    owner_id: UUID,
    team_id: Optional[UUID] = None,
    search: Optional[str] = None,
    include_public: bool = True,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[Crew], int]:
    """Get crews with pagination."""
    query = select(Crew).options(
        selectinload(Crew.agents),
        selectinload(Crew.tasks)
    )

    conditions = [Crew.owner_id == owner_id]
    if team_id:
        conditions.append(Crew.team_id == team_id)
    if include_public:
        conditions = [or_(Crew.owner_id == owner_id, Crew.is_public == True)]
    if search:
        conditions.append(
            or_(
                Crew.name.ilike(f"%{search}%"),
                Crew.description.ilike(f"%{search}%"),
            )
        )

    query = query.where(*conditions)

    count_query = select(func.count(Crew.id)).where(*conditions)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)

    return result.scalars().all(), total


async def get_crew(db: AsyncSession, crew_id: UUID, user_id: UUID) -> Optional[Crew]:
    """Get crew by ID."""
    result = await db.execute(
        select(Crew)
        .options(
            selectinload(Crew.agents),
            selectinload(Crew.tasks)
        )
        .where(
            Crew.id == crew_id,
            or_(Crew.owner_id == user_id, Crew.is_public == True)
        )
    )
    return result.scalar_one_or_none()


async def create_crew(db: AsyncSession, crew_data: CrewCreate, owner_id: UUID) -> Crew:
    """Create a new crew."""
    crew = Crew(
        name=crew_data.name,
        description=crew_data.description,
        process=crew_data.process,
        verbose=crew_data.verbose,
        manager_agent_id=crew_data.manager_agent_id,
        manager_llm=crew_data.manager_llm,
        respect_context_window=crew_data.respect_context_window,
        memory_enabled=crew_data.memory_enabled,
        memory_config=crew_data.memory_config,
        knowledge_sources=crew_data.knowledge_sources,
        embedder_config=crew_data.embedder_config,
        cache_enabled=crew_data.cache_enabled,
        max_rpm=crew_data.max_rpm,
        full_output=crew_data.full_output,
        step_callback=crew_data.step_callback,
        task_callback=crew_data.task_callback,
        planning=crew_data.planning,
        planning_llm=crew_data.planning_llm,
        stream=crew_data.stream,
        output_log_file=crew_data.output_log_file,
        owner_id=owner_id,
        team_id=crew_data.team_id,
        is_public=crew_data.is_public,
        tags=crew_data.tags,
    )
    db.add(crew)
    await db.flush()

    # Add agents
    for agent_config in crew_data.agents:
        crew_agent = CrewAgent(
            crew_id=crew.id,
            agent_id=agent_config.agent_id,
            order=agent_config.order,
            config_override=agent_config.config_override,
        )
        db.add(crew_agent)

    # Add tasks
    for task_config in crew_data.tasks:
        crew_task = CrewTask(
            crew_id=crew.id,
            task_id=task_config.task_id,
            order=task_config.order,
            config_override=task_config.config_override,
        )
        db.add(crew_task)

    await db.commit()
    await db.refresh(crew)
    return crew


async def update_crew(
    db: AsyncSession, crew_id: UUID, crew_data: CrewUpdate, user_id: UUID
) -> Optional[Crew]:
    """Update crew."""
    crew = await db.execute(
        select(Crew).where(Crew.id == crew_id, Crew.owner_id == user_id)
    )
    crew = crew.scalar_one_or_none()
    if not crew:
        return None

    update_data = crew_data.model_dump(exclude_unset=True, exclude={"agents", "tasks"})
    for field, value in update_data.items():
        setattr(crew, field, value)

    # Update agents if provided
    if crew_data.agents is not None:
        await db.execute(
            CrewAgent.__table__.delete().where(CrewAgent.crew_id == crew_id)
        )
        for agent_config in crew_data.agents:
            crew_agent = CrewAgent(
                crew_id=crew.id,
                agent_id=agent_config.agent_id,
                order=agent_config.order,
                config_override=agent_config.config_override,
            )
            db.add(crew_agent)

    # Update tasks if provided
    if crew_data.tasks is not None:
        await db.execute(
            CrewTask.__table__.delete().where(CrewTask.crew_id == crew_id)
        )
        for task_config in crew_data.tasks:
            crew_task = CrewTask(
                crew_id=crew.id,
                task_id=task_config.task_id,
                order=task_config.order,
                config_override=task_config.config_override,
            )
            db.add(crew_task)

    await db.commit()
    await db.refresh(crew)
    return crew


async def delete_crew(db: AsyncSession, crew_id: UUID, user_id: UUID) -> bool:
    """Delete crew."""
    crew = await db.execute(
        select(Crew).where(Crew.id == crew_id, Crew.owner_id == user_id)
    )
    crew = crew.scalar_one_or_none()
    if not crew:
        return False

    await db.delete(crew)
    await db.commit()
    return True


async def duplicate_crew(db: AsyncSession, crew_id: UUID, user_id: UUID) -> Optional[Crew]:
    """Duplicate a crew."""
    original = await get_crew(db, crew_id, user_id)
    if not original:
        return None

    new_crew = Crew(
        name=f"{original.name} (Copy)",
        description=original.description,
        process=original.process,
        verbose=original.verbose,
        manager_agent_id=original.manager_agent_id,
        manager_llm=original.manager_llm,
        respect_context_window=original.respect_context_window,
        memory_enabled=original.memory_enabled,
        memory_config=original.memory_config,
        knowledge_sources=original.knowledge_sources,
        embedder_config=original.embedder_config,
        cache_enabled=original.cache_enabled,
        max_rpm=original.max_rpm,
        full_output=original.full_output,
        step_callback=original.step_callback,
        task_callback=original.task_callback,
        planning=original.planning,
        planning_llm=original.planning_llm,
        stream=original.stream,
        output_log_file=original.output_log_file,
        owner_id=user_id,
        team_id=original.team_id if original.owner_id == user_id else None,
        is_public=False,
        tags=original.tags,
    )
    db.add(new_crew)
    await db.flush()

    # Copy agents
    for crew_agent in original.agents:
        new_crew_agent = CrewAgent(
            crew_id=new_crew.id,
            agent_id=crew_agent.agent_id,
            order=crew_agent.order,
            config_override=crew_agent.config_override,
        )
        db.add(new_crew_agent)

    # Copy tasks
    for crew_task in original.tasks:
        new_crew_task = CrewTask(
            crew_id=new_crew.id,
            task_id=crew_task.task_id,
            order=crew_task.order,
            config_override=crew_task.config_override,
        )
        db.add(new_crew_task)

    await db.commit()
    await db.refresh(new_crew)
    return new_crew


async def get_crew_inputs(db: AsyncSession, crew_id: UUID) -> List[str]:
    """Get required inputs for a crew (like fetch_inputs in CrewAI)."""
    crew = await db.execute(
        select(Crew)
        .options(
            selectinload(Crew.agents),
            selectinload(Crew.tasks)
        )
        .where(Crew.id == crew_id)
    )
    crew = crew.scalar_one_or_none()
    if not crew:
        return []

    inputs = set()
    placeholder_pattern = r'\{(\w+)\}'

    # Get agent IDs and fetch agents
    agent_ids = [ca.agent_id for ca in crew.agents]
    if agent_ids:
        agents_result = await db.execute(
            select(Agent).where(Agent.id.in_(agent_ids))
        )
        agents = agents_result.scalars().all()
        for agent in agents:
            for field in [agent.role, agent.goal, agent.backstory]:
                if field:
                    inputs.update(re.findall(placeholder_pattern, field))

    # Get task IDs and fetch tasks
    task_ids = [ct.task_id for ct in crew.tasks]
    if task_ids:
        tasks_result = await db.execute(
            select(Task).where(Task.id.in_(task_ids))
        )
        tasks = tasks_result.scalars().all()
        for task in tasks:
            for field in [task.description, task.expected_output]:
                if field:
                    inputs.update(re.findall(placeholder_pattern, field))

    return list(inputs)


async def deploy_crew(
    db: AsyncSession, crew_id: UUID, environment: str, user_id: UUID
) -> Optional[Crew]:
    """Deploy crew to an environment."""
    crew = await db.execute(
        select(Crew).where(Crew.id == crew_id, Crew.owner_id == user_id)
    )
    crew = crew.scalar_one_or_none()
    if not crew:
        return None

    crew.is_deployed = True
    crew.environment = environment
    await db.commit()
    await db.refresh(crew)
    return crew
