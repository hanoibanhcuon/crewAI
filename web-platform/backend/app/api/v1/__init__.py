"""
API Router v1.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    teams,
    agents,
    tasks,
    crews,
    flows,
    tools,
    executions,
    triggers,
    templates,
    knowledge,
    websocket,
)

api_router = APIRouter()

# Authentication
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Users
api_router.include_router(users.router, prefix="/users", tags=["Users"])

# Teams
api_router.include_router(teams.router, prefix="/teams", tags=["Teams"])

# Agents
api_router.include_router(agents.router, prefix="/agents", tags=["Agents"])

# Tasks
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])

# Crews
api_router.include_router(crews.router, prefix="/crews", tags=["Crews"])

# Flows
api_router.include_router(flows.router, prefix="/flows", tags=["Flows"])

# Tools
api_router.include_router(tools.router, prefix="/tools", tags=["Tools"])

# Executions
api_router.include_router(executions.router, prefix="/executions", tags=["Executions"])

# Triggers
api_router.include_router(triggers.router, prefix="/triggers", tags=["Triggers"])

# Templates (Marketplace)
api_router.include_router(templates.router, prefix="/templates", tags=["Templates"])

# Knowledge Sources
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["Knowledge"])

# WebSocket
api_router.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])
