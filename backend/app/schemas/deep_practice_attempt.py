"""
ĐGNL Mỗi Ngày - Deep Practice Attempt Schemas
"""

from datetime import datetime
from pydantic import BaseModel, Field


class DeepPracticeAttemptCreate(BaseModel):
    quiz_id: str
    quiz_title: str | None = None
    subject: str | None = None
    score_percent: int = Field(ge=0, le=100)
    correct_count: int = Field(ge=0)
    wrong_count: int = Field(ge=0)
    unanswered_count: int = Field(ge=0)
    total_questions: int = Field(ge=0)
    time_spent_seconds: int = Field(ge=0, default=0)
    answers: dict
    meta: dict | None = None


class DeepPracticeAttemptSummary(BaseModel):
    id: int
    quiz_id: str
    quiz_title: str | None
    subject: str | None
    score_percent: int
    correct_count: int
    wrong_count: int
    unanswered_count: int
    total_questions: int
    time_spent_seconds: int
    submitted_at: datetime

    class Config:
        from_attributes = True


class DeepPracticeAttemptOut(DeepPracticeAttemptSummary):
    user_id: int
    answers: dict
    meta: dict | None = None
