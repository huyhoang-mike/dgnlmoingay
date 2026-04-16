"""
ĐGNL Mỗi Ngày - Exam Setting Pydantic Schemas
"""

from datetime import datetime
from pydantic import BaseModel


class ExamSettingOut(BaseModel):
    id: int
    exam_id: str
    is_free: bool = False
    is_published: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExamSettingUpdate(BaseModel):
    is_free: bool | None = None
    is_published: bool | None = None
