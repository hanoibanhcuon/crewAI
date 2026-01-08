"""
WebSocket connection manager for real-time execution streaming.
"""
import asyncio
import json
from typing import Dict, Set, Optional, Any
from uuid import UUID
from fastapi import WebSocket, WebSocketDisconnect
import redis.asyncio as redis

from app.core.config import settings


class ConnectionManager:
    """Manages WebSocket connections and message broadcasting."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.redis_client: Optional[redis.Redis] = None
        self._pubsub_task: Optional[asyncio.Task] = None

    async def init_redis(self):
        """Initialize Redis client for pub/sub."""
        if self.redis_client is None:
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )

    async def close(self):
        """Close Redis connection."""
        if self._pubsub_task:
            self._pubsub_task.cancel()
            try:
                await self._pubsub_task
            except asyncio.CancelledError:
                pass
        if self.redis_client:
            await self.redis_client.close()

    async def connect(self, websocket: WebSocket, execution_id: str):
        """Connect a WebSocket client to an execution channel."""
        await websocket.accept()
        if execution_id not in self.active_connections:
            self.active_connections[execution_id] = set()
        self.active_connections[execution_id].add(websocket)

    def disconnect(self, websocket: WebSocket, execution_id: str):
        """Disconnect a WebSocket client from an execution channel."""
        if execution_id in self.active_connections:
            self.active_connections[execution_id].discard(websocket)
            if not self.active_connections[execution_id]:
                del self.active_connections[execution_id]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to a specific WebSocket client."""
        try:
            await websocket.send_json(message)
        except Exception:
            pass

    async def broadcast_to_execution(self, execution_id: str, message: dict):
        """Broadcast message to all clients connected to an execution."""
        if execution_id in self.active_connections:
            disconnected = []
            for websocket in self.active_connections[execution_id]:
                try:
                    await websocket.send_json(message)
                except Exception:
                    disconnected.append(websocket)

            # Clean up disconnected clients
            for ws in disconnected:
                self.active_connections[execution_id].discard(ws)

    async def publish_event(self, execution_id: str, event: dict):
        """Publish event to Redis for distribution across instances."""
        await self.init_redis()
        channel = f"execution:{execution_id}"
        await self.redis_client.publish(channel, json.dumps(event))

    async def subscribe_to_execution(self, execution_id: str, websocket: WebSocket):
        """Subscribe to Redis channel for an execution and forward messages."""
        await self.init_redis()
        pubsub = self.redis_client.pubsub()
        channel = f"execution:{execution_id}"

        await pubsub.subscribe(channel)

        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    await websocket.send_json(data)

                    # Check for completion events
                    if data.get("type") in ["complete", "error", "cancelled"]:
                        break
        except WebSocketDisconnect:
            pass
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()


# Global connection manager instance
manager = ConnectionManager()


async def broadcast_execution_event(
    execution_id: UUID,
    event_type: str,
    data: Optional[Dict[str, Any]] = None,
):
    """
    Broadcast an execution event to all connected clients.

    Event types:
    - start: Execution started
    - agent_start: Agent started working
    - agent_thinking: Agent is thinking
    - agent_action: Agent took an action
    - agent_complete: Agent completed
    - task_start: Task started
    - task_complete: Task completed
    - tool_call: Tool was called
    - llm_call: LLM was called
    - log: General log message
    - complete: Execution completed
    - error: Error occurred
    - cancelled: Execution cancelled
    - human_input_required: Waiting for human input
    """
    event = {
        "type": event_type,
        "execution_id": str(execution_id),
        "timestamp": asyncio.get_event_loop().time(),
        **(data or {})
    }

    # Publish to Redis for cross-instance support
    await manager.publish_event(str(execution_id), event)

    # Also broadcast directly to local connections
    await manager.broadcast_to_execution(str(execution_id), event)
