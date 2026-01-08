"""
Team service - business logic for team operations.
"""
from typing import List, Optional, Tuple
from uuid import UUID
from slugify import slugify
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import Team, TeamMember, User, UserRole
from app.schemas.user import TeamCreate, TeamUpdate, TeamInvite


async def get_user_teams(db: AsyncSession, user_id: UUID) -> List[Team]:
    """Get all teams for a user."""
    result = await db.execute(
        select(Team)
        .join(TeamMember)
        .where(TeamMember.user_id == user_id)
        .options(selectinload(Team.members))
    )
    return result.scalars().all()


async def get_team(db: AsyncSession, team_id: UUID, user_id: UUID) -> Optional[Team]:
    """Get team by ID if user is a member."""
    result = await db.execute(
        select(Team)
        .join(TeamMember)
        .where(Team.id == team_id, TeamMember.user_id == user_id)
        .options(selectinload(Team.members))
    )
    return result.scalar_one_or_none()


async def create_team(db: AsyncSession, team_data: TeamCreate, owner_id: UUID) -> Team:
    """Create a new team."""
    # Generate unique slug
    base_slug = slugify(team_data.name)
    slug = base_slug
    counter = 1
    while True:
        existing = await db.execute(select(Team).where(Team.slug == slug))
        if not existing.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    team = Team(
        name=team_data.name,
        slug=slug,
        description=team_data.description,
    )
    db.add(team)
    await db.flush()

    # Add owner as team member
    member = TeamMember(
        team_id=team.id,
        user_id=owner_id,
        role=UserRole.OWNER,
        can_create=True,
        can_edit=True,
        can_delete=True,
        can_deploy=True,
    )
    db.add(member)

    await db.commit()
    await db.refresh(team)
    return team


async def update_team(
    db: AsyncSession, team_id: UUID, team_data: TeamUpdate, user_id: UUID
) -> Optional[Team]:
    """Update team."""
    # Check if user is owner
    member = await db.execute(
        select(TeamMember)
        .where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
            TeamMember.role == UserRole.OWNER
        )
    )
    if not member.scalar_one_or_none():
        return None

    team = await get_team(db, team_id, user_id)
    if not team:
        return None

    update_data = team_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(team, field, value)

    await db.commit()
    await db.refresh(team)
    return team


async def delete_team(db: AsyncSession, team_id: UUID, user_id: UUID) -> bool:
    """Delete team."""
    # Check if user is owner
    member = await db.execute(
        select(TeamMember)
        .where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
            TeamMember.role == UserRole.OWNER
        )
    )
    if not member.scalar_one_or_none():
        return False

    team = await get_team(db, team_id, user_id)
    if not team:
        return False

    await db.delete(team)
    await db.commit()
    return True


async def invite_member(
    db: AsyncSession, team_id: UUID, invite_data: TeamInvite, inviter_id: UUID
) -> Optional[TeamMember]:
    """Invite a member to the team."""
    # Check if inviter has permission
    inviter = await db.execute(
        select(TeamMember)
        .where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == inviter_id,
        )
    )
    inviter_member = inviter.scalar_one_or_none()
    if not inviter_member or inviter_member.role not in [UserRole.OWNER, UserRole.ADMIN]:
        return None

    # Find user by email
    user_result = await db.execute(select(User).where(User.email == invite_data.email))
    user = user_result.scalar_one_or_none()
    if not user:
        return None

    # Check if already a member
    existing = await db.execute(
        select(TeamMember)
        .where(TeamMember.team_id == team_id, TeamMember.user_id == user.id)
    )
    if existing.scalar_one_or_none():
        return None

    member = TeamMember(
        team_id=team_id,
        user_id=user.id,
        role=UserRole(invite_data.role),
        can_create=invite_data.can_create,
        can_edit=invite_data.can_edit,
        can_delete=invite_data.can_delete,
        can_deploy=invite_data.can_deploy,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


async def remove_member(
    db: AsyncSession, team_id: UUID, member_user_id: UUID, remover_id: UUID
) -> bool:
    """Remove a member from the team."""
    # Check if remover has permission
    remover = await db.execute(
        select(TeamMember)
        .where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == remover_id,
        )
    )
    remover_member = remover.scalar_one_or_none()
    if not remover_member or remover_member.role not in [UserRole.OWNER, UserRole.ADMIN]:
        return False

    # Cannot remove owner
    member_result = await db.execute(
        select(TeamMember)
        .where(TeamMember.team_id == team_id, TeamMember.user_id == member_user_id)
    )
    member = member_result.scalar_one_or_none()
    if not member or member.role == UserRole.OWNER:
        return False

    await db.delete(member)
    await db.commit()
    return True
