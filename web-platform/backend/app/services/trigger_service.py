"""
Trigger service - business logic for trigger operations.
"""
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID
import secrets
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.trigger import Trigger, Webhook


async def get_triggers(
    db: AsyncSession,
    owner_id: UUID,
    trigger_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[Trigger], int]:
    """Get triggers with pagination."""
    query = select(Trigger)

    conditions = [Trigger.owner_id == owner_id]
    if trigger_type:
        conditions.append(Trigger.trigger_type == trigger_type)

    query = query.where(*conditions)

    count_query = select(func.count(Trigger.id)).where(*conditions)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)

    return result.scalars().all(), total


async def get_trigger(db: AsyncSession, trigger_id: UUID, owner_id: UUID) -> Optional[Trigger]:
    """Get trigger by ID."""
    result = await db.execute(
        select(Trigger).where(Trigger.id == trigger_id, Trigger.owner_id == owner_id)
    )
    return result.scalar_one_or_none()


async def create_trigger(db: AsyncSession, trigger_data, owner_id: UUID) -> Trigger:
    """Create a new trigger."""
    # Generate webhook secret if webhook type
    config = trigger_data.config.copy() if trigger_data.config else {}
    if trigger_data.trigger_type == "webhook":
        config["secret"] = secrets.token_urlsafe(32)

    trigger = Trigger(
        name=trigger_data.name,
        description=trigger_data.description,
        trigger_type=trigger_data.trigger_type,
        target_type=trigger_data.target_type,
        crew_id=trigger_data.crew_id,
        flow_id=trigger_data.flow_id,
        config=config,
        input_mapping=trigger_data.input_mapping,
        owner_id=owner_id,
    )
    db.add(trigger)
    await db.commit()
    await db.refresh(trigger)

    # Add webhook_url attribute for response
    if trigger.trigger_type == "webhook":
        trigger.webhook_url = f"/api/v1/triggers/webhook/{trigger.id}"

    return trigger


async def update_trigger(
    db: AsyncSession, trigger_id: UUID, trigger_data, owner_id: UUID
) -> Optional[Trigger]:
    """Update trigger."""
    trigger = await get_trigger(db, trigger_id, owner_id)
    if not trigger:
        return None

    update_data = trigger_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trigger, field, value)

    await db.commit()
    await db.refresh(trigger)
    return trigger


async def delete_trigger(db: AsyncSession, trigger_id: UUID, owner_id: UUID) -> bool:
    """Delete trigger."""
    trigger = await get_trigger(db, trigger_id, owner_id)
    if not trigger:
        return False

    await db.delete(trigger)
    await db.commit()
    return True


async def handle_webhook(
    db: AsyncSession,
    trigger_id: UUID,
    payload: Dict[str, Any],
    headers: Dict[str, str],
) -> Optional[Dict[str, Any]]:
    """Handle incoming webhook."""
    # Get trigger without owner check (public endpoint)
    result = await db.execute(
        select(Trigger).where(Trigger.id == trigger_id, Trigger.is_active == True)
    )
    trigger = result.scalar_one_or_none()
    if not trigger:
        return None

    # Verify webhook signature if secret is set
    secret = trigger.config.get("secret") if trigger.config else None
    if secret:
        # In production, verify the signature from headers
        pass

    # Map input payload to crew/flow inputs
    inputs = {}
    if trigger.input_mapping:
        for key, path in trigger.input_mapping.items():
            # Simple dot-notation path resolution
            value = payload
            for part in path.split("."):
                if isinstance(value, dict):
                    value = value.get(part)
                else:
                    value = None
                    break
            inputs[key] = value
    else:
        inputs = payload

    # Update trigger stats
    trigger.last_triggered_at = datetime.utcnow()
    trigger.trigger_count = (trigger.trigger_count or 0) + 1

    # Create execution
    from app.services import execution_service

    if trigger.target_type == "crew" and trigger.crew_id:
        execution = await execution_service.create_crew_execution(
            db,
            crew_id=trigger.crew_id,
            inputs=inputs,
            user_id=trigger.owner_id,
            async_execution=True,
        )
    elif trigger.target_type == "flow" and trigger.flow_id:
        execution = await execution_service.create_flow_execution(
            db,
            flow_id=trigger.flow_id,
            inputs=inputs,
            initial_state={},
            user_id=trigger.owner_id,
            async_execution=True,
        )
    else:
        return None

    await db.commit()

    return {"execution_id": str(execution.id), "status": "triggered"}
