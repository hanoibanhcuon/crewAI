"""
Task service - business logic for task operations.
"""
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.task import Task, TaskDependency
from app.schemas.task import TaskCreate, TaskUpdate


async def get_tasks(
    db: AsyncSession,
    owner_id: UUID,
    team_id: Optional[UUID] = None,
    search: Optional[str] = None,
    include_public: bool = True,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[Task], int]:
    """Get tasks with pagination."""
    query = select(Task).options(selectinload(Task.dependencies))

    conditions = [Task.owner_id == owner_id]
    if team_id:
        conditions.append(Task.team_id == team_id)
    if include_public:
        conditions = [or_(Task.owner_id == owner_id, Task.is_public == True)]
    if search:
        conditions.append(
            or_(
                Task.name.ilike(f"%{search}%"),
                Task.description.ilike(f"%{search}%"),
            )
        )

    query = query.where(*conditions)

    count_query = select(func.count(Task.id)).where(*conditions)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)

    return result.scalars().all(), total


async def get_task(db: AsyncSession, task_id: UUID, user_id: UUID) -> Optional[Task]:
    """Get task by ID."""
    result = await db.execute(
        select(Task)
        .options(selectinload(Task.dependencies))
        .where(
            Task.id == task_id,
            or_(Task.owner_id == user_id, Task.is_public == True)
        )
    )
    return result.scalar_one_or_none()


async def create_task(db: AsyncSession, task_data: TaskCreate, owner_id: UUID) -> Task:
    """Create a new task."""
    task = Task(
        name=task_data.name,
        description=task_data.description,
        expected_output=task_data.expected_output,
        agent_id=task_data.agent_id,
        async_execution=task_data.async_execution,
        human_input=task_data.human_input,
        markdown=task_data.markdown,
        output_file=task_data.output_file,
        output_json_schema=task_data.output_json_schema,
        output_pydantic_model=task_data.output_pydantic_model,
        create_directory=task_data.create_directory,
        callback_url=task_data.callback_url,
        guardrails=task_data.guardrails,
        guardrail_max_retries=task_data.guardrail_max_retries,
        tools=[str(t) for t in task_data.tools],
        owner_id=owner_id,
        team_id=task_data.team_id,
        is_public=task_data.is_public,
        tags=task_data.tags,
    )
    db.add(task)
    await db.flush()

    # Add dependencies
    for dep_id in task_data.dependency_ids:
        dependency = TaskDependency(task_id=task.id, depends_on_id=dep_id)
        db.add(dependency)

    await db.commit()
    await db.refresh(task)
    return task


async def update_task(
    db: AsyncSession, task_id: UUID, task_data: TaskUpdate, user_id: UUID
) -> Optional[Task]:
    """Update task."""
    task = await db.execute(
        select(Task).where(Task.id == task_id, Task.owner_id == user_id)
    )
    task = task.scalar_one_or_none()
    if not task:
        return None

    update_data = task_data.model_dump(exclude_unset=True, exclude={"dependency_ids"})
    for field, value in update_data.items():
        if field == "tools" and value is not None:
            value = [str(t) for t in value]
        setattr(task, field, value)

    # Update dependencies if provided
    if task_data.dependency_ids is not None:
        await db.execute(
            TaskDependency.__table__.delete().where(TaskDependency.task_id == task_id)
        )
        for dep_id in task_data.dependency_ids:
            dependency = TaskDependency(task_id=task.id, depends_on_id=dep_id)
            db.add(dependency)

    await db.commit()
    await db.refresh(task)
    return task


async def delete_task(db: AsyncSession, task_id: UUID, user_id: UUID) -> bool:
    """Delete task."""
    task = await db.execute(
        select(Task).where(Task.id == task_id, Task.owner_id == user_id)
    )
    task = task.scalar_one_or_none()
    if not task:
        return False

    await db.delete(task)
    await db.commit()
    return True


async def duplicate_task(db: AsyncSession, task_id: UUID, user_id: UUID) -> Optional[Task]:
    """Duplicate a task."""
    original = await get_task(db, task_id, user_id)
    if not original:
        return None

    new_task = Task(
        name=f"{original.name} (Copy)",
        description=original.description,
        expected_output=original.expected_output,
        agent_id=original.agent_id if original.owner_id == user_id else None,
        async_execution=original.async_execution,
        human_input=original.human_input,
        markdown=original.markdown,
        output_file=original.output_file,
        output_json_schema=original.output_json_schema,
        output_pydantic_model=original.output_pydantic_model,
        create_directory=original.create_directory,
        callback_url=original.callback_url,
        guardrails=original.guardrails,
        guardrail_max_retries=original.guardrail_max_retries,
        tools=original.tools,
        owner_id=user_id,
        team_id=original.team_id if original.owner_id == user_id else None,
        is_public=False,
        tags=original.tags,
    )
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)
    return new_task
