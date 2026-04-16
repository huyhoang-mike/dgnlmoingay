"""
ĐGNL Mỗi Ngày - Exam Setting Model
Stores admin-configurable access settings for mock exams.
Exam content stays as static JSON; this table controls access permissions.
"""

import datetime
from sqlalchemy import Integer, String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ExamSetting(Base):
    __tablename__ = "exam_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )  # Matches the "id" field in index.json

    # Access control
    is_free: Mapped[bool] = mapped_column(Boolean, default=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )
