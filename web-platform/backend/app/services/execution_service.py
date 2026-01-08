"""
Execution service - business logic for execution operations.
"""
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any, AsyncGenerator
from uuid import UUID
import json
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.execution import Execution, ExecutionLog, Trace, ExecutionStatus, LogLevel


async def get_executions(
    db: AsyncSession,
    user_id: UUID,
    execution_type: Optional[str] = None,
    status: Optional[str] = None,
    crew_id: Optional[UUID] = None,
    flow_id: Optional[UUID] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[Execution], int]:
    """Get executions with pagination."""
    query = select(Execution)

    conditions = [Execution.triggered_by == user_id]
    if execution_type:
        conditions.append(Execution.execution_type == execution_type)
    if status:
        conditions.append(Execution.status == status)
    if crew_id:
        conditions.append(Execution.crew_id == crew_id)
    if flow_id:
        conditions.append(Execution.flow_id == flow_id)

    query = query.where(*conditions).order_by(Execution.created_at.desc())

    count_query = select(func.count(Execution.id)).where(*conditions)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)

    return result.scalars().all(), total


async def get_execution(db: AsyncSession, execution_id: UUID, user_id: UUID) -> Optional[Execution]:
    """Get execution by ID."""
    result = await db.execute(
        select(Execution).where(
            Execution.id == execution_id,
            Execution.triggered_by == user_id
        )
    )
    return result.scalar_one_or_none()


async def create_crew_execution(
    db: AsyncSession,
    crew_id: UUID,
    inputs: Dict[str, Any],
    user_id: UUID,
    async_execution: bool = False,
) -> Execution:
    """Create a crew execution."""
    execution = Execution(
        execution_type="crew",
        crew_id=crew_id,
        status=ExecutionStatus.PENDING if async_execution else ExecutionStatus.RUNNING,
        inputs=inputs,
        trigger_type="manual",
        triggered_by=user_id,
        started_at=datetime.utcnow(),
    )
    db.add(execution)
    await db.commit()
    await db.refresh(execution)

    # In production, start the actual crew execution
    # For now, mark as completed for sync execution
    if not async_execution:
        execution.status = ExecutionStatus.COMPLETED
        execution.completed_at = datetime.utcnow()
        execution.outputs = {"result": "Mock crew execution completed"}
        await db.commit()
        await db.refresh(execution)

    return execution


async def create_flow_execution(
    db: AsyncSession,
    flow_id: UUID,
    inputs: Dict[str, Any],
    initial_state: Dict[str, Any],
    user_id: UUID,
    async_execution: bool = False,
) -> Execution:
    """Create a flow execution."""
    execution = Execution(
        execution_type="flow",
        flow_id=flow_id,
        status=ExecutionStatus.PENDING if async_execution else ExecutionStatus.RUNNING,
        inputs={**inputs, "initial_state": initial_state},
        trigger_type="manual",
        triggered_by=user_id,
        started_at=datetime.utcnow(),
    )
    db.add(execution)
    await db.commit()
    await db.refresh(execution)

    return execution


async def cancel_execution(db: AsyncSession, execution_id: UUID, user_id: UUID) -> bool:
    """Cancel a running execution."""
    execution = await get_execution(db, execution_id, user_id)
    if not execution:
        return False

    if execution.status not in [ExecutionStatus.PENDING, ExecutionStatus.RUNNING]:
        return False

    execution.status = ExecutionStatus.CANCELLED
    execution.completed_at = datetime.utcnow()
    await db.commit()
    return True


async def get_execution_logs(
    db: AsyncSession,
    execution_id: UUID,
    user_id: UUID,
    level: Optional[str] = None,
    limit: int = 100,
) -> List[ExecutionLog]:
    """Get execution logs."""
    execution = await get_execution(db, execution_id, user_id)
    if not execution:
        return []

    query = select(ExecutionLog).where(ExecutionLog.execution_id == execution_id)
    if level:
        query = query.where(ExecutionLog.level == level)
    query = query.order_by(ExecutionLog.timestamp.desc()).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


async def get_execution_traces(
    db: AsyncSession, execution_id: UUID, user_id: UUID
) -> List[Trace]:
    """Get execution traces."""
    execution = await get_execution(db, execution_id, user_id)
    if not execution:
        return []

    result = await db.execute(
        select(Trace)
        .where(Trace.execution_id == execution_id)
        .order_by(Trace.start_time)
    )
    return result.scalars().all()


async def stream_crew_execution(
    db: AsyncSession,
    crew_id: UUID,
    inputs: Dict[str, Any],
    user_id: UUID,
) -> AsyncGenerator[str, None]:
    """Stream crew execution output."""
    # Create execution
    execution = await create_crew_execution(db, crew_id, inputs, user_id, async_execution=True)

    # In production, this would stream actual execution events
    # For now, yield mock events
    events = [
        {"type": "start", "execution_id": str(execution.id)},
        {"type": "agent_start", "agent": "Researcher", "task": "Research AI trends"},
        {"type": "llm_call", "model": "gpt-4", "tokens": 150},
        {"type": "agent_complete", "agent": "Researcher", "output": "Research findings..."},
        {"type": "complete", "output": "Final result"},
    ]

    for event in events:
        yield json.dumps(event)


async def submit_human_feedback(
    db: AsyncSession,
    execution_id: UUID,
    feedback: Dict[str, Any],
    user_id: UUID,
) -> Dict[str, Any]:
    """Submit human feedback for a waiting execution."""
    execution = await get_execution(db, execution_id, user_id)
    if not execution or execution.status != ExecutionStatus.WAITING_HUMAN:
        return {"error": "Invalid execution state"}

    # In production, this would resume the execution with the feedback
    execution.status = ExecutionStatus.RUNNING
    await db.commit()

    return {"status": "resumed", "feedback": feedback}
