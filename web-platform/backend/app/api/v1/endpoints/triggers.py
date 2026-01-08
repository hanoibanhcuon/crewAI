"""
Trigger endpoints.
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.services import trigger_service

router = APIRouter()


# Pydantic models for triggers
from pydantic import BaseModel
from typing import Dict, Any, List
from datetime import datetime


class TriggerCreate(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_type: str  # webhook, schedule, email, slack, github, custom
    target_type: str  # crew, flow
    crew_id: Optional[UUID] = None
    flow_id: Optional[UUID] = None
    config: Dict[str, Any] = {}
    input_mapping: Dict[str, Any] = {}


class TriggerUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    input_mapping: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class TriggerResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    trigger_type: str
    target_type: str
    crew_id: Optional[UUID]
    flow_id: Optional[UUID]
    config: Dict[str, Any]
    input_mapping: Dict[str, Any]
    is_active: bool
    last_triggered_at: Optional[datetime]
    trigger_count: int
    webhook_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TriggerListResponse(BaseModel):
    items: List[TriggerResponse]
    total: int
    page: int
    page_size: int
    pages: int


@router.get("/", response_model=TriggerListResponse)
async def list_triggers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    trigger_type: Optional[str] = None,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List triggers with pagination.
    """
    triggers, total = await trigger_service.get_triggers(
        db,
        owner_id=current_user.id,
        trigger_type=trigger_type,
        page=page,
        page_size=page_size
    )

    return TriggerListResponse(
        items=[TriggerResponse.model_validate(t) for t in triggers],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.post("/", response_model=TriggerResponse, status_code=status.HTTP_201_CREATED)
async def create_trigger(
    trigger_data: TriggerCreate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new trigger.
    """
    trigger = await trigger_service.create_trigger(db, trigger_data, current_user.id)
    return TriggerResponse.model_validate(trigger)


@router.get("/{trigger_id}", response_model=TriggerResponse)
async def get_trigger(
    trigger_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get trigger by ID.
    """
    trigger = await trigger_service.get_trigger(db, trigger_id, current_user.id)
    if not trigger:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trigger not found"
        )
    return TriggerResponse.model_validate(trigger)


@router.patch("/{trigger_id}", response_model=TriggerResponse)
async def update_trigger(
    trigger_id: UUID,
    trigger_data: TriggerUpdate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update trigger.
    """
    trigger = await trigger_service.update_trigger(db, trigger_id, trigger_data, current_user.id)
    if not trigger:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trigger not found"
        )
    return TriggerResponse.model_validate(trigger)


@router.delete("/{trigger_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trigger(
    trigger_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete trigger.
    """
    success = await trigger_service.delete_trigger(db, trigger_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trigger not found"
        )


# Webhook endpoint (public, for receiving external triggers)
@router.post("/webhook/{trigger_id}")
async def receive_webhook(
    trigger_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Receive webhook payload and trigger execution.
    """
    # Get request body
    body = await request.json()

    # Get headers for signature verification
    headers = dict(request.headers)

    result = await trigger_service.handle_webhook(db, trigger_id, body, headers)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook processing failed"
        )

    return {"message": "Webhook received", "execution_id": result.get("execution_id")}
