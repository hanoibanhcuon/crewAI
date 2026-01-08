"""
Crew endpoints.
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.schemas.crew import (
    CrewCreate, CrewUpdate, CrewResponse, CrewListResponse,
    CrewKickoffRequest, CrewKickoffResponse
)
from app.services import crew_service, execution_service

router = APIRouter()


@router.get("/", response_model=CrewListResponse)
async def list_crews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    team_id: Optional[UUID] = None,
    include_public: bool = True,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List crews with pagination.
    """
    crews, total = await crew_service.get_crews(
        db,
        owner_id=current_user.id,
        team_id=team_id,
        search=search,
        include_public=include_public,
        page=page,
        page_size=page_size
    )

    return CrewListResponse(
        items=[CrewResponse.model_validate(crew) for crew in crews],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.post("/", response_model=CrewResponse, status_code=status.HTTP_201_CREATED)
async def create_crew(
    crew_data: CrewCreate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new crew.
    """
    crew = await crew_service.create_crew(db, crew_data, current_user.id)
    return CrewResponse.model_validate(crew)


@router.get("/{crew_id}", response_model=CrewResponse)
async def get_crew(
    crew_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get crew by ID.
    """
    crew = await crew_service.get_crew(db, crew_id, current_user.id)
    if not crew:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew not found"
        )
    return CrewResponse.model_validate(crew)


@router.patch("/{crew_id}", response_model=CrewResponse)
async def update_crew(
    crew_id: UUID,
    crew_data: CrewUpdate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update crew.
    """
    crew = await crew_service.update_crew(db, crew_id, crew_data, current_user.id)
    if not crew:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew not found"
        )
    return CrewResponse.model_validate(crew)


@router.delete("/{crew_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_crew(
    crew_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete crew.
    """
    success = await crew_service.delete_crew(db, crew_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew not found"
        )


@router.post("/{crew_id}/kickoff", response_model=CrewKickoffResponse)
async def kickoff_crew(
    crew_id: UUID,
    kickoff_data: CrewKickoffRequest,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Start crew execution.
    """
    crew = await crew_service.get_crew(db, crew_id, current_user.id)
    if not crew:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew not found"
        )

    # Create execution
    execution = await execution_service.create_crew_execution(
        db,
        crew_id=crew_id,
        inputs=kickoff_data.inputs,
        user_id=current_user.id,
        async_execution=kickoff_data.async_execution
    )

    return CrewKickoffResponse(
        execution_id=execution.id,
        status=execution.status.value,
        message="Crew execution started" if kickoff_data.async_execution else "Crew execution completed"
    )


@router.get("/{crew_id}/kickoff/stream")
async def kickoff_crew_stream(
    crew_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Start crew execution with streaming output.
    """
    crew = await crew_service.get_crew(db, crew_id, current_user.id)
    if not crew:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew not found"
        )

    async def event_generator():
        async for event in execution_service.stream_crew_execution(db, crew_id, {}, current_user.id):
            yield f"data: {event}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )


@router.post("/{crew_id}/duplicate", response_model=CrewResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_crew(
    crew_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Duplicate a crew.
    """
    crew = await crew_service.duplicate_crew(db, crew_id, current_user.id)
    if not crew:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew not found"
        )
    return CrewResponse.model_validate(crew)


@router.get("/{crew_id}/inputs")
async def get_crew_inputs(
    crew_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get required inputs for a crew (fetch_inputs).
    """
    crew = await crew_service.get_crew(db, crew_id, current_user.id)
    if not crew:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew not found"
        )

    inputs = await crew_service.get_crew_inputs(db, crew_id)
    return {"inputs": inputs}


@router.post("/{crew_id}/deploy")
async def deploy_crew(
    crew_id: UUID,
    environment: str = "production",
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deploy crew to an environment.
    """
    crew = await crew_service.deploy_crew(db, crew_id, environment, current_user.id)
    if not crew:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew not found"
        )
    return {"message": f"Crew deployed to {environment}", "crew_id": str(crew_id)}
