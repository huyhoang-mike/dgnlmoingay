"""
ĐGNL Mỗi Ngày - Lessons Router
CRUD endpoints for course lessons with access control.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.lesson import Lesson
from app.models.user import User
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonOut
from app.auth import get_current_user, require_admin

router = APIRouter()


def _apply_access_control(lesson: Lesson, user: Optional[User]) -> dict:
    """Convert lesson to dict with access control applied."""
    data = {
        "id": lesson.id,
        "title": lesson.title,
        "description": lesson.description,
        "order": lesson.order,
        "category": lesson.category,
        "subject": lesson.subject,
        "is_published": lesson.is_published,
        "is_free": lesson.is_free,
        "created_at": lesson.created_at,
        "updated_at": lesson.updated_at,
        "video_drive_id": None,
        "pdf_drive_id": None,
        "answer_pdf_drive_id": None,
        "content": None,
        "is_locked": True,
    }

    # Grant full access if: lesson is free, user is enrolled, or user is admin
    has_access = lesson.is_free
    if user and (user.is_enrolled or user.is_admin):
        has_access = True

    if has_access:
        data["video_drive_id"] = lesson.video_drive_id
        data["pdf_drive_id"] = lesson.pdf_drive_id
        data["answer_pdf_drive_id"] = lesson.answer_pdf_drive_id
        data["content"] = lesson.content
        data["is_locked"] = False

    return data


# ── List lessons ──────────────────────────────
@router.get("/", response_model=list[LessonOut])
async def list_lessons(
    category: Optional[str] = None,
    subject: Optional[str] = None,
    published_only: bool = True,
    free_only: bool = False,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    query = select(Lesson).order_by(Lesson.order)
    if published_only:
        query = query.where(Lesson.is_published == True)  # noqa: E712
    if category:
        query = query.where(Lesson.category == category)
    if subject:
        query = query.where(Lesson.subject == subject)
    if free_only:
        query = query.where(Lesson.is_free == True)  # noqa: E712

    result = await db.execute(query)
    lessons = result.scalars().all()
    return [_apply_access_control(l, user) for l in lessons]


# ── Get single lesson ────────────────────────
@router.get("/{lesson_id}", response_model=LessonOut)
async def get_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return _apply_access_control(lesson, user)


# ── Create lesson (admin only) ────────────────
@router.post("/", response_model=LessonOut, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    data: LessonCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    lesson = Lesson(**data.model_dump())
    db.add(lesson)
    await db.flush()
    await db.refresh(lesson)
    return _apply_access_control(lesson, admin)


# ── Update lesson (admin only) ────────────────
@router.put("/{lesson_id}", response_model=LessonOut)
async def update_lesson(
    lesson_id: int,
    data: LessonUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(lesson, key, value)

    await db.flush()
    await db.refresh(lesson)
    return _apply_access_control(lesson, admin)


# ── Delete lesson (admin only) ────────────────
@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    await db.delete(lesson)
    await db.flush()
    return None
