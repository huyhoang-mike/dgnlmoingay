"""
ĐGNL Mỗi Ngày - Authentication Router
Google OAuth login and user management endpoints.
"""

import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from google.oauth2 import id_token
from google.auth.transport import requests
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import GoogleLoginRequest, UserOut, TokenResponse
from app.auth import create_access_token, require_auth, require_admin

router = APIRouter()


# ── Google OAuth Login ────────────────────────
@router.post("/google", response_model=TokenResponse)
async def google_login(data: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with Google OAuth2 ID token."""
    try:
        idinfo = id_token.verify_oauth2_token(
            data.credential,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    email = idinfo.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by Google",
        )

    name = idinfo.get("name", email.split("@")[0])
    picture = idinfo.get("picture")
    google_id = idinfo.get("sub")

    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email,
            name=name,
            picture=picture,
            google_id=google_id,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
    else:
        user.name = name
        user.picture = picture
        user.last_login = datetime.datetime.utcnow()
        await db.flush()
        await db.refresh(user)

    # Issue JWT
    token = create_access_token(data={"sub": user.email, "user_id": user.id})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


# ── Get Current User ─────────────────────────
@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(require_auth)):
    """Get current authenticated user info."""
    return user


# ── Admin: List Users ─────────────────────────
@router.get("/users", response_model=list[UserOut])
async def list_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users (admin only)."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


# ── Admin: Enroll User ───────────────────────
@router.put("/users/{user_id}/enroll", response_model=UserOut)
async def enroll_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Grant course access to a user (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_enrolled = True
    await db.flush()
    await db.refresh(user)
    return user


# ── Admin: Unenroll User ─────────────────────
@router.put("/users/{user_id}/unenroll", response_model=UserOut)
async def unenroll_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Revoke course access from a user (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_enrolled = False
    await db.flush()
    await db.refresh(user)
    return user


# ── Admin: Toggle Admin ──────────────────────
@router.put("/users/{user_id}/toggle-admin", response_model=UserOut)
async def toggle_admin(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Toggle admin status for a user (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = not user.is_admin
    await db.flush()
    await db.refresh(user)
    return user
