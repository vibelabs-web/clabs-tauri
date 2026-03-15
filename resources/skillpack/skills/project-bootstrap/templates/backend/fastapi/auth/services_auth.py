"""Authentication service."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.core.security import get_password_hash, verify_password


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Get user by email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    """Authenticate user with email and password."""
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def create_user(db: AsyncSession, user_in: RegisterRequest) -> User:
    """Create new user."""
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        nickname=user_in.nickname,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_password(db: AsyncSession, user: User, new_password: str) -> User:
    """Update user password."""
    user.hashed_password = get_password_hash(new_password)
    await db.commit()
    await db.refresh(user)
    return user
