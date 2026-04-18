"""
ĐGNL Mỗi Ngày - Exam Attempt Pydantic Schemas
"""

from datetime import datetime
from pydantic import BaseModel, Field


class ExamAttemptCreate(BaseModel):
    """Payload sent by the frontend after a student submits a mock exam."""

    exam_id: str
    exam_title: str | None = None
    score: int = Field(ge=0)
    max_score: int = Field(ge=0)
    correct_count: int = Field(ge=0)
    wrong_count: int = Field(ge=0)
    unanswered_count: int = Field(ge=0)
    total_questions: int = Field(ge=0)
    time_spent_seconds: int = Field(ge=0, default=0)
    answers: dict  # { "<question_index>": "<A|B|C|D>" }
    meta: dict | None = None  # per-subject breakdown, etc.


class ExamAttemptSummary(BaseModel):
    """Lightweight row for history listings (no answers payload)."""

    id: int
    exam_id: str
    exam_title: str | None
    score: int
    max_score: int
    correct_count: int
    wrong_count: int
    unanswered_count: int
    total_questions: int
    time_spent_seconds: int
    submitted_at: datetime

    class Config:
        from_attributes = True


class ExamAttemptOut(ExamAttemptSummary):
    """Full attempt with selected answers + breakdown."""

    user_id: int
    answers: dict
    meta: dict | None = None
