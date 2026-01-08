"""
User endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, get_current_active_user
from app.schemas.user import UserUpdate, UserResponse, PasswordChange, APIKeyCreate, APIKeyResponse
from app.services import user_service

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user = Depends(get_current_active_user)
):
    """
    Get current user profile.
    """
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_data: UserUpdate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user profile.
    """
    updated_user = await user_service.update_user(db, current_user.id, user_data)
    return UserResponse.model_validate(updated_user)


@router.post("/me/password")
async def change_password(
    password_data: PasswordChange,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change current user password.
    """
    from app.core.security import verify_password

    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )

    # Update password
    await user_service.update_password(db, current_user.id, password_data.new_password)

    return {"message": "Password updated successfully"}


@router.get("/me/api-keys", response_model=List[APIKeyResponse])
async def get_api_keys(
    current_user = Depends(get_current_active_user)
):
    """
    Get configured API keys.
    """
    api_keys = current_user.api_keys or {}
    return [
        APIKeyResponse(
            provider=provider,
            is_set=bool(key),
            last_updated=None
        )
        for provider, key in api_keys.items()
    ]


@router.post("/me/api-keys")
async def set_api_key(
    api_key_data: APIKeyCreate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Set an API key for a provider.
    """
    await user_service.set_api_key(db, current_user.id, api_key_data.provider, api_key_data.api_key)
    return {"message": f"API key for {api_key_data.provider} set successfully"}


@router.delete("/me/api-keys/{provider}")
async def delete_api_key(
    provider: str,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an API key for a provider.
    """
    await user_service.delete_api_key(db, current_user.id, provider)
    return {"message": f"API key for {provider} deleted successfully"}
