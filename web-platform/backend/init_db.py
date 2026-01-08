"""
Initialize database tables and create initial user.
"""
import asyncio
import sys
sys.path.insert(0, '.')

from app.core.database import engine, Base
from app.models import *  # Import all models to register them
from app.services import user_service
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal


async def init_db():
    """Create all tables."""
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully!")


async def create_user(email: str, password: str, full_name: str):
    """Create a user."""
    from app.schemas.user import UserCreate

    async with AsyncSessionLocal() as db:
        # Check if user exists
        existing = await user_service.get_user_by_email(db, email)
        if existing:
            print(f"User {email} already exists!")
            return existing

        # Create new user
        user_data = UserCreate(email=email, password=password, full_name=full_name)
        user = await user_service.create_user(db, user_data)
        await db.commit()
        print(f"User created: {user.email}")
        return user


async def main():
    await init_db()

    # Create the user
    await create_user(
        email="hanoibanhcuon@gmail.com",
        password="123456aA@",
        full_name="Hanoi User"
    )


if __name__ == "__main__":
    asyncio.run(main())
