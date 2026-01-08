"""
Flow service - business logic for flow operations.
"""
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.flow import Flow, FlowStep, FlowConnection
from app.schemas.flow import FlowCreate, FlowUpdate, FlowStepCreate, FlowStepUpdate, FlowConnectionCreate


async def get_flows(
    db: AsyncSession,
    owner_id: UUID,
    team_id: Optional[UUID] = None,
    search: Optional[str] = None,
    include_public: bool = True,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[Flow], int]:
    """Get flows with pagination."""
    query = select(Flow).options(
        selectinload(Flow.steps),
        selectinload(Flow.connections)
    )

    conditions = [Flow.owner_id == owner_id]
    if team_id:
        conditions.append(Flow.team_id == team_id)
    if include_public:
        conditions = [or_(Flow.owner_id == owner_id, Flow.is_public == True)]
    if search:
        conditions.append(
            or_(
                Flow.name.ilike(f"%{search}%"),
                Flow.description.ilike(f"%{search}%"),
            )
        )

    query = query.where(*conditions)

    count_query = select(func.count(Flow.id)).where(*conditions)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)

    return result.scalars().all(), total


async def get_flow(db: AsyncSession, flow_id: UUID, user_id: UUID) -> Optional[Flow]:
    """Get flow by ID."""
    result = await db.execute(
        select(Flow)
        .options(
            selectinload(Flow.steps),
            selectinload(Flow.connections)
        )
        .where(
            Flow.id == flow_id,
            or_(Flow.owner_id == user_id, Flow.is_public == True)
        )
    )
    return result.scalar_one_or_none()


async def create_flow(db: AsyncSession, flow_data: FlowCreate, owner_id: UUID) -> Flow:
    """Create a new flow."""
    flow = Flow(
        name=flow_data.name,
        description=flow_data.description,
        state_schema=flow_data.state_schema,
        persistence_enabled=flow_data.persistence_enabled,
        persistence_type=flow_data.persistence_type,
        stream=flow_data.stream,
        owner_id=owner_id,
        team_id=flow_data.team_id,
        is_public=flow_data.is_public,
        tags=flow_data.tags,
    )
    db.add(flow)
    await db.flush()

    # Add steps
    step_map = {}  # Map temp IDs to actual IDs
    for i, step_data in enumerate(flow_data.steps):
        step = FlowStep(
            flow_id=flow.id,
            name=step_data.name,
            description=step_data.description,
            step_type=step_data.step_type,
            position_x=step_data.position_x,
            position_y=step_data.position_y,
            config=step_data.config,
            crew_id=step_data.crew_id,
            order=step_data.order or i,
        )
        db.add(step)
        await db.flush()
        step_map[i] = step.id

    # Add connections
    for conn_data in flow_data.connections:
        connection = FlowConnection(
            flow_id=flow.id,
            source_step_id=conn_data.source_step_id,
            target_step_id=conn_data.target_step_id,
            connection_type=conn_data.connection_type,
            condition=conn_data.condition,
            route_name=conn_data.route_name,
            label=conn_data.label,
        )
        db.add(connection)

    await db.commit()
    await db.refresh(flow)
    return flow


async def update_flow(
    db: AsyncSession, flow_id: UUID, flow_data: FlowUpdate, user_id: UUID
) -> Optional[Flow]:
    """Update flow."""
    flow = await db.execute(
        select(Flow).where(Flow.id == flow_id, Flow.owner_id == user_id)
    )
    flow = flow.scalar_one_or_none()
    if not flow:
        return None

    update_data = flow_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(flow, field, value)

    await db.commit()
    await db.refresh(flow)
    return flow


async def delete_flow(db: AsyncSession, flow_id: UUID, user_id: UUID) -> bool:
    """Delete flow."""
    flow = await db.execute(
        select(Flow).where(Flow.id == flow_id, Flow.owner_id == user_id)
    )
    flow = flow.scalar_one_or_none()
    if not flow:
        return False

    await db.delete(flow)
    await db.commit()
    return True


async def add_step(
    db: AsyncSession, flow_id: UUID, step_data: FlowStepCreate, user_id: UUID
) -> Optional[Flow]:
    """Add a step to the flow."""
    flow = await get_flow(db, flow_id, user_id)
    if not flow or flow.owner_id != user_id:
        return None

    step = FlowStep(
        flow_id=flow_id,
        name=step_data.name,
        description=step_data.description,
        step_type=step_data.step_type,
        position_x=step_data.position_x,
        position_y=step_data.position_y,
        config=step_data.config,
        crew_id=step_data.crew_id,
        order=step_data.order,
    )
    db.add(step)
    await db.commit()
    await db.refresh(flow)
    return flow


async def update_step(
    db: AsyncSession, flow_id: UUID, step_id: UUID, step_data: FlowStepUpdate, user_id: UUID
) -> Optional[Flow]:
    """Update a flow step."""
    flow = await get_flow(db, flow_id, user_id)
    if not flow or flow.owner_id != user_id:
        return None

    step = await db.execute(
        select(FlowStep).where(FlowStep.id == step_id, FlowStep.flow_id == flow_id)
    )
    step = step.scalar_one_or_none()
    if not step:
        return None

    update_data = step_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(step, field, value)

    await db.commit()
    await db.refresh(flow)
    return flow


async def delete_step(
    db: AsyncSession, flow_id: UUID, step_id: UUID, user_id: UUID
) -> Optional[Flow]:
    """Delete a flow step."""
    flow = await get_flow(db, flow_id, user_id)
    if not flow or flow.owner_id != user_id:
        return None

    step = await db.execute(
        select(FlowStep).where(FlowStep.id == step_id, FlowStep.flow_id == flow_id)
    )
    step = step.scalar_one_or_none()
    if not step:
        return None

    await db.delete(step)
    await db.commit()
    await db.refresh(flow)
    return flow


async def add_connection(
    db: AsyncSession, flow_id: UUID, conn_data: FlowConnectionCreate, user_id: UUID
) -> Optional[Flow]:
    """Add a connection between flow steps."""
    flow = await get_flow(db, flow_id, user_id)
    if not flow or flow.owner_id != user_id:
        return None

    connection = FlowConnection(
        flow_id=flow_id,
        source_step_id=conn_data.source_step_id,
        target_step_id=conn_data.target_step_id,
        connection_type=conn_data.connection_type,
        condition=conn_data.condition,
        route_name=conn_data.route_name,
        label=conn_data.label,
    )
    db.add(connection)
    await db.commit()
    await db.refresh(flow)
    return flow


async def delete_connection(
    db: AsyncSession, flow_id: UUID, connection_id: UUID, user_id: UUID
) -> Optional[Flow]:
    """Delete a flow connection."""
    flow = await get_flow(db, flow_id, user_id)
    if not flow or flow.owner_id != user_id:
        return None

    connection = await db.execute(
        select(FlowConnection).where(
            FlowConnection.id == connection_id,
            FlowConnection.flow_id == flow_id
        )
    )
    connection = connection.scalar_one_or_none()
    if not connection:
        return None

    await db.delete(connection)
    await db.commit()
    await db.refresh(flow)
    return flow


async def duplicate_flow(db: AsyncSession, flow_id: UUID, user_id: UUID) -> Optional[Flow]:
    """Duplicate a flow."""
    original = await get_flow(db, flow_id, user_id)
    if not original:
        return None

    new_flow = Flow(
        name=f"{original.name} (Copy)",
        description=original.description,
        state_schema=original.state_schema,
        persistence_enabled=original.persistence_enabled,
        persistence_type=original.persistence_type,
        stream=original.stream,
        owner_id=user_id,
        team_id=original.team_id if original.owner_id == user_id else None,
        is_public=False,
        tags=original.tags,
    )
    db.add(new_flow)
    await db.flush()

    # Copy steps and build mapping
    step_mapping = {}
    for step in original.steps:
        new_step = FlowStep(
            flow_id=new_flow.id,
            name=step.name,
            description=step.description,
            step_type=step.step_type,
            position_x=step.position_x,
            position_y=step.position_y,
            config=step.config,
            crew_id=step.crew_id,
            order=step.order,
        )
        db.add(new_step)
        await db.flush()
        step_mapping[step.id] = new_step.id

    # Copy connections with updated step IDs
    for conn in original.connections:
        new_conn = FlowConnection(
            flow_id=new_flow.id,
            source_step_id=step_mapping.get(conn.source_step_id),
            target_step_id=step_mapping.get(conn.target_step_id),
            connection_type=conn.connection_type,
            condition=conn.condition,
            route_name=conn.route_name,
            label=conn.label,
        )
        db.add(new_conn)

    await db.commit()
    await db.refresh(new_flow)
    return new_flow
