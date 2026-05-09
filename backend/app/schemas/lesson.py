"""
ĐGNL Mỗi Ngày - Lesson Pydantic Schemas
"""

from datetime import datetime
from pydantic import BaseModel


class LessonBase(BaseModel):
    title: str
    description: str | None = None
    order: int = 0
    category: str = "nentang"  # nentang | luyende | thucchien
    subject: str | None = None
    video_drive_id: str | None = None
    pdf_drive_id: str | None = None
    answer_pdf_drive_id: str | None = None
    content: str | None = None
    is_published: bool = False
    is_free: bool = False


class LessonCreate(LessonBase):
    pass


class LessonUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    order: int | None = None
    category: str | None = None
    subject: str | None = None
    video_drive_id: str | None = None
    pdf_drive_id: str | None = None
    answer_pdf_drive_id: str | None = None
    content: str | None = None
    is_published: bool | None = None
    is_free: bool | None = None


class LessonOut(LessonBase):
    id: int
    is_locked: bool = False  # True if user cannot access content
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
