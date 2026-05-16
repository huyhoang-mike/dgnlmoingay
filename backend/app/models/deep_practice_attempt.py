"""
ĐGNL Mỗi Ngày - Deep Practice Attempt Model
Stores each submitted specialized quiz attempt for authenticated users.
"""

import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DeepPracticeAttempt(Base):
    __tablename__ = "deep_practice_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quiz_id: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    quiz_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    subject: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    score_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    correct_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    wrong_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unanswered_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    answers: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    submitted_at: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        default=datetime.datetime.utcnow,
        nullable=False,
        index=True,
    )

    user = relationship("User", lazy="joined")
