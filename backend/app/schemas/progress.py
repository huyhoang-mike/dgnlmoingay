"""
ĐGNL Mỗi Ngày - User Progress Pydantic Schemas
"""

from datetime import datetime
from pydantic import BaseModel


class ProgressBase(BaseModel):
    user_id: str
    lesson_id: int
    is_completed: bool = False
    progress_percent: float = 0.0


class ProgressCreate(ProgressBase):
    pass


class ProgressUpdate(BaseModel):
    is_completed: bool | None = None
    progress_percent: float | None = None


class ProgressOut(ProgressBase):
    id: int
    last_accessed: datetime
    completed_at: datetime | None = None

    class Config:
        from_attributes = True
