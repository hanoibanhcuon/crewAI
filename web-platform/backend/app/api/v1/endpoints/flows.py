"""
Flow endpoints.
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.schemas.flow import (
    FlowCreate, FlowUpdate, FlowResponse, FlowListResponse,
    FlowStepCreate, FlowStepUpdate, FlowConnectionCreate,
    FlowKickoffRequest, FlowKickoffResponse
)
from app.services import flow_service, execution_service

router = APIRouter()


@router.get("/", response_model=FlowListResponse)
async def list_flows(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    team_id: Optional[UUID] = None,
    include_public: bool = True,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List flows with pagination.
    """
    flows, total = await flow_service.get_flows(
        db,
        owner_id=current_user.id,
        team_id=team_id,
        search=search,
        include_public=include_public,
        page=page,
        page_size=page_size
    )

    return FlowListResponse(
        items=[FlowResponse.model_validate(flow) for flow in flows],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.post("/", response_model=FlowResponse, status_code=status.HTTP_201_CREATED)
async def create_flow(
    flow_data: FlowCreate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new flow.
    """
    flow = await flow_service.create_flow(db, flow_data, current_user.id)
    return FlowResponse.model_validate(flow)


@router.get("/{flow_id}", response_model=FlowResponse)
async def get_flow(
    flow_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get flow by ID.
    """
    flow = await flow_service.get_flow(db, flow_id, current_user.id)
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flow not found"
        )
    return FlowResponse.model_validate(flow)


@router.patch("/{flow_id}", response_model=FlowResponse)
async def update_flow(
    flow_id: UUID,
    flow_data: FlowUpdate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update flow.
    """
    flow = await flow_service.update_flow(db, flow_id, flow_data, current_user.id)
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flow not found"
        )
    return FlowResponse.model_validate(flow)


@router.delete("/{flow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flow(
    flow_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete flow.
    """
    success = await flow_service.delete_flow(db, flow_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flow not found"
        )


# Flow Steps
@router.post("/{flow_id}/steps", response_model=FlowResponse)
async def add_flow_step(
    flow_id: UUID,
    step_data: FlowStepCreate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add a step to the flow.
    """
    flow = await flow_service.add_step(db, flow_id, step_data, current_user.id)
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flow not found"
        )
    return FlowResponse.model_validate(flow)


@router.patch("/{flow_id}/steps/{step_id}", response_model=FlowResponse)
async def update_flow_step(
    flow_id: UUID,
    step_id: UUID,
    step_data: FlowStepUpdate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a flow step.
    """
    flow = await flow_service.update_step(db, flow_id, step_id, step_data, current_user.id)
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flow or step not found"
        )
    return FlowResponse.model_validate(flow)


@router.delete("/{flow_id}/steps/{step_id}", response_model=FlowResponse)
async def delete_flow_step(
    flow_id: UUID,
    step_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a flow step.
    """
    flow = await flow_service.delete_step(db, flow_id, step_id, current_user.id)
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flow or step not found"
        )
    return FlowResponse.model_validate(flow)


# Flow Connections
@router.post("/{flow_id}/connections", response_model=FlowResponse)
async def add_flow_connection(
    flow_id: UUID,
    connection_data: FlowConnectionCreate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add a connection between flow steps.
    """
    flow = await flow_service.add_connection(db, flow_id, connection_data, current_user.id)
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flow not found"
        )
    return FlowResponse.model_validate(flow)


@router.delete("/{flow_id}/connections/{connection_id}", response_model=FlowResponse)
async def delete_flow_connection(
    flow_id: UUID,
    connection_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a flow connection.
    """
    flow = await flow_service.delete_connection(db, flow_id, connection_id, current_user.id)
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flow or connection not found"
        )
    return FlowResponse.model_validate(flow)


# Flow Execution
@router.post("/{flow_id}/kickoff", response_model=FlowKickoffResponse)
async def kickoff_flow(
    flow_id: UUID,
    kickoff_data: FlowKickoffRequest,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Start flow execution.
    """
    flow = await flow_service.get_flow(db, flow_id, current_user.id)
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flow not found"
        )

    execution = await execution_service.create_flow_execution(
        db,
        flow_id=flow_id,
        inputs=kickoff_data.inputs,
        initial_state=kickoff_data.initial_state,
        user_id=current_user.id,
        async_execution=kickoff_data.async_execution
    )

    # Start Celery task for async execution
    if kickoff_data.async_execution:
        from app.workers.flow_executor import execute_flow
        execute_flow.delay(
            str(execution.id),
            str(flow_id),
            kickoff_data.inputs,
            kickoff_data.initial_state,
        )

    return FlowKickoffResponse(
        execution_id=execution.id,
        status=execution.status.value,
        message="Flow execution started"
    )


@router.post("/{flow_id}/duplicate", response_model=FlowResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_flow(
    flow_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Duplicate a flow.
    """
    flow = await flow_service.duplicate_flow(db, flow_id, current_user.id)
    if not flow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flow not found"
        )
    return FlowResponse.model_validate(flow)
