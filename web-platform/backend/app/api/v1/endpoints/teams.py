"""
Team endpoints.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.schemas.user import TeamCreate, TeamUpdate, TeamResponse, TeamInvite
from app.services import team_service

router = APIRouter()


@router.get("/", response_model=List[TeamResponse])
async def list_teams(
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all teams for current user.
    """
    teams = await team_service.get_user_teams(db, current_user.id)
    return [TeamResponse.model_validate(team) for team in teams]


@router.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_data: TeamCreate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new team.
    """
    team = await team_service.create_team(db, team_data, current_user.id)
    return TeamResponse.model_validate(team)


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get team by ID.
    """
    team = await team_service.get_team(db, team_id, current_user.id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    return TeamResponse.model_validate(team)


@router.patch("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: UUID,
    team_data: TeamUpdate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update team.
    """
    team = await team_service.update_team(db, team_id, team_data, current_user.id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    return TeamResponse.model_validate(team)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete team.
    """
    success = await team_service.delete_team(db, team_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found or not authorized"
        )


@router.post("/{team_id}/invite", status_code=status.HTTP_201_CREATED)
async def invite_member(
    team_id: UUID,
    invite_data: TeamInvite,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Invite a member to the team.
    """
    member = await team_service.invite_member(db, team_id, invite_data, current_user.id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not invite member"
        )
    return {"message": f"Invitation sent to {invite_data.email}"}


@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    team_id: UUID,
    user_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a member from the team.
    """
    success = await team_service.remove_member(db, team_id, user_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not remove member"
        )
