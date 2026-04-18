"""
ĐGNL Mỗi Ngày - Exam Attempt Model
Stores a record of each completed mock-exam attempt by an enrolled student:
- the answers they selected for every question
- the computed score / correct counts
- the time spent
The exam questions themselves remain in static JSON files; we reference them
by ``exam_id`` (matches the ``id`` field in /public/exams/index.json).
"""

import datetime

from sqlalchemy import Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    exam_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    exam_title: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Snapshot of computed result
    score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    correct_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    wrong_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unanswered_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # ``answers``: { "<question_index>": "<chosen letter A|B|C|D>", ... }
    # ``meta``: arbitrary breakdown info (per-subject correct/total, etc.)
    answers: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    submitted_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, nullable=False
    )

    user = relationship("User", lazy="joined")
