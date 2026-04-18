"""
ĐGNL Mỗi Ngày - Exam Settings Router
Public endpoint for reading exam access settings,
admin endpoints for managing mock exam access control,
plus per-student exam attempt history.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.exam_setting import ExamSetting
from app.models.exam_attempt import ExamAttempt
from app.models.user import User
from app.schemas.exam_setting import ExamSettingOut, ExamSettingUpdate
from app.schemas.exam_attempt import (
    ExamAttemptCreate, ExamAttemptOut, ExamAttemptSummary,
)
from app.auth import require_admin, require_auth, require_enrolled

router = APIRouter()


# ── List exam settings (public) ──────────────
@router.get("/settings", response_model=list[ExamSettingOut])
async def list_exam_settings(db: AsyncSession = Depends(get_db)):
    """Get all exam access settings. Public endpoint used by frontend."""
    result = await db.execute(
        select(ExamSetting).order_by(ExamSetting.exam_id)
    )
    return result.scalars().all()


# ── Update exam setting (admin — upsert) ─────
@router.put("/settings/{exam_id}", response_model=ExamSettingOut)
async def update_exam_setting(
    exam_id: str,
    data: ExamSettingUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create or update exam access settings (admin only).
    Uses upsert: creates the row if it doesn't exist yet."""
    result = await db.execute(
        select(ExamSetting).where(ExamSetting.exam_id == exam_id)
    )
    setting = result.scalar_one_or_none()

    if not setting:
        setting = ExamSetting(exam_id=exam_id)
        db.add(setting)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(setting, key, value)

    await db.flush()
    await db.refresh(setting)
    return setting


# ════════════════════════════════════════════════
# Exam Attempts — only for enrolled students
# ════════════════════════════════════════════════
#
# Attempts are tied to ``users.id`` and are saved to the database so that
# students can review their previous answers and track score progression.
# Guests (un-enrolled users) intentionally cannot save attempts; the front
# end still allows them to take *free* exams locally, but nothing persists.

@router.post(
    "/attempts",
    response_model=ExamAttemptOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_exam_attempt(
    data: ExamAttemptCreate,
    user: User = Depends(require_enrolled),
    db: AsyncSession = Depends(get_db),
):
    """Persist a completed mock-exam attempt. Enrolled students only."""
    attempt = ExamAttempt(
        user_id=user.id,
        exam_id=data.exam_id,
        exam_title=data.exam_title,
        score=data.score,
        max_score=data.max_score,
        correct_count=data.correct_count,
        wrong_count=data.wrong_count,
        unanswered_count=data.unanswered_count,
        total_questions=data.total_questions,
        time_spent_seconds=data.time_spent_seconds,
        answers=data.answers,
        meta=data.meta,
    )
    db.add(attempt)
    await db.flush()
    await db.refresh(attempt)
    return attempt


@router.get("/attempts/me", response_model=list[ExamAttemptSummary])
async def list_my_attempts(
    exam_id: str | None = None,
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Return the current user's attempts, newest first.
    Optional ``?exam_id=...`` filter shows history for a single exam.
    Un-enrolled users simply get an empty list (no 403)."""
    if not (user.is_enrolled or user.is_admin):
        return []
    stmt = select(ExamAttempt).where(ExamAttempt.user_id == user.id)
    if exam_id:
        stmt = stmt.where(ExamAttempt.exam_id == exam_id)
    stmt = stmt.order_by(ExamAttempt.submitted_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/attempts/{attempt_id}", response_model=ExamAttemptOut)
async def get_attempt(
    attempt_id: int,
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get a single attempt with full answers. Owner or admin only."""
    result = await db.execute(
        select(ExamAttempt).where(ExamAttempt.id == attempt_id)
    )
    attempt = result.scalar_one_or_none()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.user_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")
    return attempt


@router.get(
    "/attempts/user/{user_id}",
    response_model=list[ExamAttemptSummary],
)
async def list_user_attempts(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: list every attempt by a specific student."""
    result = await db.execute(
        select(ExamAttempt)
        .where(ExamAttempt.user_id == user_id)
        .order_by(ExamAttempt.submitted_at.desc())
    )
    return result.scalars().all()

