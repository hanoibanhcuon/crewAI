"""
Execution endpoints.
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.schemas.execution import (
    ExecutionResponse, ExecutionListResponse,
    ExecutionLogResponse, TraceResponse, TraceListResponse
)
from app.services import execution_service

router = APIRouter()


@router.get("/", response_model=ExecutionListResponse)
async def list_executions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    execution_type: Optional[str] = None,
    status: Optional[str] = None,
    crew_id: Optional[UUID] = None,
    flow_id: Optional[UUID] = None,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List executions with pagination.
    """
    executions, total = await execution_service.get_executions(
        db,
        user_id=current_user.id,
        execution_type=execution_type,
        status=status,
        crew_id=crew_id,
        flow_id=flow_id,
        page=page,
        page_size=page_size
    )

    return ExecutionListResponse(
        items=[ExecutionResponse.model_validate(ex) for ex in executions],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/{execution_id}", response_model=ExecutionResponse)
async def get_execution(
    execution_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get execution by ID.
    """
    execution = await execution_service.get_execution(db, execution_id, current_user.id)
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    return ExecutionResponse.model_validate(execution)


@router.post("/{execution_id}/cancel")
async def cancel_execution(
    execution_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel a running execution.
    """
    success = await execution_service.cancel_execution(db, execution_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not cancel execution"
        )
    return {"message": "Execution cancelled"}


@router.get("/{execution_id}/logs", response_model=list[ExecutionLogResponse])
async def get_execution_logs(
    execution_id: UUID,
    level: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get execution logs.
    """
    logs = await execution_service.get_execution_logs(
        db, execution_id, current_user.id, level=level, limit=limit
    )
    return [ExecutionLogResponse.model_validate(log) for log in logs]


@router.get("/{execution_id}/traces", response_model=TraceListResponse)
async def get_execution_traces(
    execution_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get execution traces.
    """
    traces = await execution_service.get_execution_traces(db, execution_id, current_user.id)
    return TraceListResponse(
        items=[TraceResponse.model_validate(trace) for trace in traces],
        total=len(traces)
    )


@router.post("/{execution_id}/human-feedback")
async def submit_human_feedback(
    execution_id: UUID,
    feedback: dict,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit human feedback for a waiting execution.
    """
    execution = await execution_service.get_execution(db, execution_id, current_user.id)
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )

    if execution.status != "waiting_human":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Execution is not waiting for human feedback"
        )

    result = await execution_service.submit_human_feedback(
        db, execution_id, feedback, current_user.id
    )
    return {"message": "Feedback submitted", "result": result}
