"""
ĐGNL Mỗi Ngày - User Progress Router
Track and update user progress through lessons.
"""

import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.progress import UserProgress
from app.schemas.progress import ProgressCreate, ProgressUpdate, ProgressOut

router = APIRouter()


# ── Get progress for a user ───────────────────
@router.get("/user/{user_id}", response_model=list[ProgressOut])
async def get_user_progress(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user_id)
    )
    return result.scalars().all()


# ── Get progress for a specific lesson ────────
@router.get("/user/{user_id}/lesson/{lesson_id}", response_model=ProgressOut)
async def get_lesson_progress(
    user_id: str, lesson_id: int, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.lesson_id == lesson_id,
        )
    )
    progress = result.scalar_one_or_none()
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")
    return progress


# ── Create / Initialize progress ──────────────
@router.post("/", response_model=ProgressOut, status_code=status.HTTP_201_CREATED)
async def create_progress(data: ProgressCreate, db: AsyncSession = Depends(get_db)):
    progress = UserProgress(**data.model_dump())
    db.add(progress)
    await db.flush()
    await db.refresh(progress)
    return progress


# ── Update progress ───────────────────────────
@router.put("/user/{user_id}/lesson/{lesson_id}", response_model=ProgressOut)
async def update_progress(
    user_id: str,
    lesson_id: int,
    data: ProgressUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.lesson_id == lesson_id,
        )
    )
    progress = result.scalar_one_or_none()
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(progress, key, value)

    # Auto-set completed_at timestamp
    if data.is_completed:
        progress.completed_at = datetime.datetime.utcnow()

    progress.last_accessed = datetime.datetime.utcnow()
    await db.flush()
    await db.refresh(progress)
    return progress
