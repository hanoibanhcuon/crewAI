"""
User service - business logic for user operations.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> Optional[User]:
    """Get user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get user by email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
    """Create a new user."""
    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_user(db: AsyncSession, user_id: UUID, user_data: UserUpdate) -> Optional[User]:
    """Update user profile."""
    user = await get_user_by_id(db, user_id)
    if not user:
        return None

    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user


async def update_last_login(db: AsyncSession, user_id: UUID) -> None:
    """Update user's last login timestamp."""
    user = await get_user_by_id(db, user_id)
    if user:
        user.last_login_at = datetime.utcnow()
        await db.commit()


async def update_password(db: AsyncSession, user_id: UUID, new_password: str) -> None:
    """Update user password."""
    user = await get_user_by_id(db, user_id)
    if user:
        user.hashed_password = get_password_hash(new_password)
        await db.commit()


async def set_api_key(db: AsyncSession, user_id: UUID, provider: str, api_key: str) -> None:
    """Set an API key for a provider."""
    from sqlalchemy.orm.attributes import flag_modified

    user = await get_user_by_id(db, user_id)
    if user:
        # Create a new dict to ensure SQLAlchemy detects the change
        api_keys = dict(user.api_keys or {})
        api_keys[provider] = api_key  # In production, encrypt this!
        user.api_keys = api_keys
        flag_modified(user, "api_keys")  # Explicitly mark as modified
        await db.commit()
        await db.refresh(user)


async def delete_api_key(db: AsyncSession, user_id: UUID, provider: str) -> None:
    """Delete an API key for a provider."""
    from sqlalchemy.orm.attributes import flag_modified

    user = await get_user_by_id(db, user_id)
    if user and user.api_keys:
        api_keys = dict(user.api_keys)  # Create a new dict
        api_keys.pop(provider, None)
        user.api_keys = api_keys
        flag_modified(user, "api_keys")  # Explicitly mark as modified
        await db.commit()
        await db.refresh(user)
