"""
ĐGNL Mỗi Ngày - Exam Settings Router
Public endpoint for reading exam access settings,
admin endpoints for managing mock exam access control.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.exam_setting import ExamSetting
from app.models.user import User
from app.schemas.exam_setting import ExamSettingOut, ExamSettingUpdate
from app.auth import require_admin

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
