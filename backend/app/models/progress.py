"""
ĐGNL Mỗi Ngày - User Progress Model
"""

import datetime
from sqlalchemy import Integer, String, Boolean, DateTime, Float, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserProgress(Base):
    __tablename__ = "user_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # In a real app, this would be a FK to a users table
    user_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    lesson_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    progress_percent: Mapped[float] = mapped_column(Float, default=0.0)

    last_accessed: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime, nullable=True
    )
