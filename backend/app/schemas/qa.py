"""
ĐGNL Mỗi Ngày - Q&A Pydantic Schemas
"""

from datetime import datetime
from pydantic import BaseModel, Field


class QAAuthorOut(BaseModel):
    id: int
    name: str
    picture: str | None = None
    is_enrolled: bool = False
    is_admin: bool = False


class QAQuestionCreate(BaseModel):
    title: str = Field(min_length=8, max_length=255)
    body: str = Field(min_length=10, max_length=8000)
    visibility: str = "public"
    subject: str | None = Field(default=None, max_length=100)
    tags: list[str] = Field(default_factory=list, max_length=8)
    images: list[str] = Field(default_factory=list, max_length=4)


class QAAnswerCreate(BaseModel):
    body: str = Field(min_length=2, max_length=8000)
    images: list[str] = Field(default_factory=list, max_length=4)


class QAAnswerOut(BaseModel):
    id: int
    question_id: int
    body: str
    images: list[str]
    is_admin_answer: bool
    is_accepted: bool
    author: QAAuthorOut
    created_at: datetime
    updated_at: datetime


class QAQuestionSummary(BaseModel):
    id: int
    title: str
    body: str
    images: list[str]
    visibility: str
    status: str
    subject: str | None
    tags: list[str]
    is_priority: bool
    is_pinned: bool
    answer_count: int
    view_count: int
    author: QAAuthorOut
    created_at: datetime
    updated_at: datetime
    last_activity_at: datetime


class QAQuestionOut(QAQuestionSummary):
    answers: list[QAAnswerOut] = Field(default_factory=list)


class QAUploadOut(BaseModel):
    urls: list[str]
