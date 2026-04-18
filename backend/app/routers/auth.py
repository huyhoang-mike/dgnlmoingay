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
from app.schemas.user import (
    GoogleLoginRequest, UserOut, TokenResponse, UserCreate, UserUpdate,
)
from app.auth import create_access_token, require_auth, require_admin

router = APIRouter()


# ── Google OAuth Login ────────────────────────
@router.post("/google", response_model=TokenResponse)
async def google_login(data: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with Google OAuth2 ID token.

    If a user record already exists for this email (e.g. the admin
    pre-registered the student), we **bind** the Google identity to it
    and preserve the admin-set fields (``is_enrolled``, ``enrollment_year``,
    ``course_type``).
    """
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
        # First-time real login of a pre-registered account → bind google_id.
        if not user.google_id:
            user.google_id = google_id
        # Don't overwrite a name the admin manually set unless it's blank.
        if not user.name or user.name == email.split("@")[0]:
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


# ── Admin: Pre-register a student by email ────
@router.post(
    "/users",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_user(
    data: UserCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a student account from an email address.

    The ``google_id`` stays NULL until the student actually signs in via
    Google. ``name`` defaults to the local-part of the email if omitted —
    it will be replaced by the real Google name on first login (unless the
    admin manually changed it).

    If a user with that email already exists, we update the admin-editable
    fields rather than failing — this makes the form idempotent.
    """
    email = data.email.lower().strip()

    result = await db.execute(select(User).where(User.email == email))
    existing = result.scalar_one_or_none()

    if existing:
        # Idempotent upsert of admin-controlled fields
        if data.name is not None:
            existing.name = data.name
        if data.enrollment_year is not None:
            existing.enrollment_year = data.enrollment_year
        if data.course_type is not None:
            existing.course_type = data.course_type
        existing.is_enrolled = data.is_enrolled
        if data.is_admin:
            existing.is_admin = True
        await db.flush()
        await db.refresh(existing)
        return existing

    user = User(
        email=email,
        name=(data.name or email.split("@")[0]),
        picture=None,
        google_id=None,
        enrollment_year=data.enrollment_year,
        course_type=data.course_type,
        is_enrolled=data.is_enrolled,
        is_admin=data.is_admin,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


# ── Admin: Update student profile / enrollment ──
@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    data: UserUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a student's profile and enrollment info (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    payload = data.model_dump(exclude_unset=True)

    # Guard: don't let an admin demote themselves
    if "is_admin" in payload and user.id == admin.id and payload["is_admin"] is False:
        raise HTTPException(
            status_code=400,
            detail="Bạn không thể tự gỡ quyền admin của chính mình.",
        )

    for key, value in payload.items():
        setattr(user, key, value)

    await db.flush()
    await db.refresh(user)
    return user


# ── Admin: Delete user ───────────────────────
@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user account (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(
            status_code=400, detail="Bạn không thể xóa chính mình."
        )
    await db.delete(user)
    await db.flush()
    return None


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
    if user.id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="Bạn không thể tự gỡ quyền admin của chính mình.",
        )
    user.is_admin = not user.is_admin
    await db.flush()
    await db.refresh(user)
    return user

