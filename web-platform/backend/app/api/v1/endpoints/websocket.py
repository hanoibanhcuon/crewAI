"""
WebSocket endpoints for real-time execution streaming.
"""
import json
from uuid import UUID
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from app.core.config import settings
from app.core.database import get_db, AsyncSessionLocal
from app.core.websocket import manager
from app.services import execution_service

router = APIRouter()


async def get_user_from_token(token: str) -> dict:
    """Validate token and return user info."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return {"id": payload.get("sub"), "email": payload.get("email")}
    except jwt.PyJWTError:
        return None


@router.websocket("/executions/{execution_id}")
async def websocket_execution(
    websocket: WebSocket,
    execution_id: UUID,
    token: str = Query(None),
):
    """
    WebSocket endpoint for streaming execution events.

    Connect with: ws://host/api/v1/ws/executions/{execution_id}?token={jwt_token}

    Events sent to client:
    - start: {"type": "start", "execution_id": "..."}
    - agent_start: {"type": "agent_start", "agent": "name", "task": "..."}
    - agent_thinking: {"type": "agent_thinking", "agent": "name", "thought": "..."}
    - agent_action: {"type": "agent_action", "agent": "name", "action": "...", "input": "..."}
    - agent_complete: {"type": "agent_complete", "agent": "name", "output": "..."}
    - task_start: {"type": "task_start", "task": "name"}
    - task_complete: {"type": "task_complete", "task": "name", "output": "..."}
    - tool_call: {"type": "tool_call", "tool": "name", "input": "...", "output": "..."}
    - llm_call: {"type": "llm_call", "model": "...", "tokens": 100}
    - log: {"type": "log", "level": "info", "message": "..."}
    - progress: {"type": "progress", "percent": 50, "message": "..."}
    - complete: {"type": "complete", "output": {...}}
    - error: {"type": "error", "message": "..."}
    - cancelled: {"type": "cancelled"}
    - human_input_required: {"type": "human_input_required", "prompt": "...", "options": [...]}
    """
    # Validate token
    if not token:
        await websocket.close(code=4001, reason="Token required")
        return

    user = await get_user_from_token(token)
    if not user:
        await websocket.close(code=4001, reason="Invalid token")
        return

    # Verify user has access to this execution
    async with AsyncSessionLocal() as db:
        execution = await execution_service.get_execution(
            db, execution_id, UUID(user["id"])
        )
        if not execution:
            await websocket.close(code=4004, reason="Execution not found")
            return

    # Connect and subscribe
    await manager.connect(websocket, str(execution_id))

    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "execution_id": str(execution_id),
            "status": execution.status.value,
        })

        # Subscribe to Redis channel for this execution
        await manager.subscribe_to_execution(str(execution_id), websocket)

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, str(execution_id))


@router.websocket("/crews/{crew_id}/stream")
async def websocket_crew_kickoff(
    websocket: WebSocket,
    crew_id: UUID,
    token: str = Query(None),
):
    """
    WebSocket endpoint for starting crew execution with streaming.

    Connect with: ws://host/api/v1/ws/crews/{crew_id}/stream?token={jwt_token}

    Client can send:
    - {"type": "kickoff", "inputs": {...}}
    - {"type": "cancel"}
    - {"type": "human_feedback", "feedback": {...}}
    """
    # Validate token
    if not token:
        await websocket.close(code=4001, reason="Token required")
        return

    user = await get_user_from_token(token)
    if not user:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await websocket.accept()

    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "kickoff":
                inputs = data.get("inputs", {})

                async with AsyncSessionLocal() as db:
                    # Import here to avoid circular imports
                    from app.services import crew_service

                    # Verify crew exists
                    crew = await crew_service.get_crew(db, crew_id, UUID(user["id"]))
                    if not crew:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Crew not found"
                        })
                        continue

                    # Create execution
                    execution = await execution_service.create_crew_execution(
                        db,
                        crew_id=crew_id,
                        inputs=inputs,
                        user_id=UUID(user["id"]),
                        async_execution=True
                    )

                    # Send execution started
                    await websocket.send_json({
                        "type": "execution_created",
                        "execution_id": str(execution.id),
                        "status": execution.status.value,
                    })

                    # Start Celery task
                    from app.workers.crew_executor import execute_crew
                    execute_crew.delay(
                        str(execution.id),
                        str(crew_id),
                        inputs
                    )

                    # Subscribe to execution events
                    await manager.subscribe_to_execution(str(execution.id), websocket)

            elif message_type == "cancel":
                execution_id = data.get("execution_id")
                if execution_id:
                    async with AsyncSessionLocal() as db:
                        await execution_service.cancel_execution(
                            db, UUID(execution_id), UUID(user["id"])
                        )
                        await websocket.send_json({
                            "type": "cancelled",
                            "execution_id": execution_id
                        })

            elif message_type == "human_feedback":
                execution_id = data.get("execution_id")
                feedback = data.get("feedback", {})
                if execution_id:
                    async with AsyncSessionLocal() as db:
                        result = await execution_service.submit_human_feedback(
                            db, UUID(execution_id), feedback, UUID(user["id"])
                        )
                        await websocket.send_json({
                            "type": "feedback_submitted",
                            "execution_id": execution_id,
                            "result": result
                        })

    except WebSocketDisconnect:
        pass
