"""
ĐGNL Mỗi Ngày - Q&A Router
Public SEO-friendly question browsing plus authenticated posting/answering.
"""

import datetime
import os
import re
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, require_auth
from app.database import get_db
from app.models.qa import QAAnswer, QAQuestion
from app.models.user import User
from app.schemas.qa import (
    QAAnswerCreate,
    QAAnswerOut,
    QAAuthorOut,
    QAQuestionCreate,
    QAQuestionOut,
    QAQuestionSummary,
    QAUploadOut,
)

router = APIRouter()

UPLOAD_DIR = Path(os.getenv("QA_UPLOAD_DIR", "/app/uploads/qa"))
UPLOAD_URL_PREFIX = os.getenv("QA_UPLOAD_URL_PREFIX", "/uploads/qa")
MAX_IMAGE_BYTES = int(os.getenv("QA_MAX_IMAGE_BYTES", str(5 * 1024 * 1024)))
MAX_IMAGES_PER_REQUEST = int(os.getenv("QA_MAX_IMAGES_PER_REQUEST", "4"))
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def _is_enrolled(user: User | None) -> bool:
    return bool(user and (user.is_enrolled or user.is_admin))


def _normalize_visibility(requested: str | None, user: User) -> str:
    if requested == "course" and _is_enrolled(user):
        return "course"
    return "public"


def _normalize_tags(raw_tags: str | list[str] | None) -> list[str]:
    if not raw_tags:
        return []
    if isinstance(raw_tags, str):
        parts = re.split(r"[,#]", raw_tags)
    else:
        parts = raw_tags
    clean_tags = []
    seen = set()
    for tag in parts:
        normalized = str(tag).strip().lower()[:40]
        if normalized and normalized not in seen:
            seen.add(normalized)
            clean_tags.append(normalized)
    return clean_tags[:8]


def _author_out(user: User) -> QAAuthorOut:
    return QAAuthorOut(
        id=user.id,
        name=user.name,
        picture=user.picture,
        is_enrolled=user.is_enrolled or user.is_admin,
        is_admin=user.is_admin,
    )


async def _load_users(db: AsyncSession, user_ids: set[int]) -> dict[int, User]:
    if not user_ids:
        return {}
    result = await db.execute(select(User).where(User.id.in_(user_ids)))
    return {user.id: user for user in result.scalars().all()}


def _question_summary(question: QAQuestion, users_by_id: dict[int, User]) -> QAQuestionSummary:
    author = users_by_id.get(question.author_id)
    if not author:
        raise HTTPException(status_code=500, detail="Question author not found")
    return QAQuestionSummary(
        id=question.id,
        title=question.title,
        body=question.body,
        images=question.images or [],
        visibility=question.visibility,
        status=question.status,
        subject=question.subject,
        tags=question.tags or [],
        is_priority=question.is_priority,
        is_pinned=question.is_pinned,
        answer_count=question.answer_count,
        view_count=question.view_count,
        author=_author_out(author),
        created_at=question.created_at,
        updated_at=question.updated_at,
        last_activity_at=question.last_activity_at,
    )


def _answer_out(answer: QAAnswer, users_by_id: dict[int, User]) -> QAAnswerOut:
    author = users_by_id.get(answer.author_id)
    if not author:
        raise HTTPException(status_code=500, detail="Answer author not found")
    return QAAnswerOut(
        id=answer.id,
        question_id=answer.question_id,
        body=answer.body,
        images=answer.images or [],
        is_admin_answer=answer.is_admin_answer,
        is_accepted=answer.is_accepted,
        author=_author_out(author),
        created_at=answer.created_at,
        updated_at=answer.updated_at,
    )


async def _ensure_can_view_question(question: QAQuestion, user: User | None) -> None:
    if question.visibility == "public":
        return
    if _is_enrolled(user) or (user and user.id == question.author_id):
        return
    raise HTTPException(status_code=403, detail="Course enrollment required")


async def _save_images(files: list[UploadFile] | None) -> list[str]:
    if not files:
        return []
    if len(files) > MAX_IMAGES_PER_REQUEST:
        raise HTTPException(status_code=400, detail=f"Upload tối đa {MAX_IMAGES_PER_REQUEST} ảnh mỗi lần")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    saved_urls = []
    for file in files:
        if not file.filename:
            continue
        extension = ALLOWED_IMAGE_TYPES.get(file.content_type or "")
        if not extension:
            raise HTTPException(status_code=400, detail="Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF")

        content = await file.read()
        if len(content) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=400, detail="Mỗi ảnh tối đa 5MB")

        today = datetime.datetime.utcnow().strftime("%Y/%m")
        target_dir = UPLOAD_DIR / today
        target_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4().hex}{extension}"
        target_path = target_dir / filename
        target_path.write_bytes(content)
        saved_urls.append(f"{UPLOAD_URL_PREFIX}/{today}/{filename}")

    return saved_urls


@router.post("/uploads", response_model=QAUploadOut)
async def upload_qa_images(
    files: list[UploadFile] = File(...),
    user: User = Depends(require_auth),
):
    """Upload Q&A images to the VPS-backed persistent volume."""
    return QAUploadOut(urls=await _save_images(files))


@router.get("/questions", response_model=list[QAQuestionSummary])
async def list_questions(
    scope: str = "auto",
    subject: str | None = None,
    q: str | None = None,
    limit: int = 30,
    offset: int = 0,
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List public Q&A questions. Enrolled users can also see course-only questions."""
    limit = max(1, min(limit, 60))
    stmt = select(QAQuestion)

    if scope == "mine":
        if not user:
            raise HTTPException(status_code=401, detail="Authentication required")
        stmt = stmt.where(QAQuestion.author_id == user.id)
    elif scope == "course":
        if not _is_enrolled(user):
            raise HTTPException(status_code=403, detail="Course enrollment required")
        stmt = stmt.where(QAQuestion.visibility == "course")
    elif scope == "all" and user and user.is_admin:
        pass
    elif _is_enrolled(user):
        stmt = stmt.where(or_(QAQuestion.visibility == "public", QAQuestion.visibility == "course"))
    else:
        stmt = stmt.where(QAQuestion.visibility == "public")

    if subject:
        stmt = stmt.where(QAQuestion.subject == subject)
    if q:
        keyword = f"%{q.strip()}%"
        stmt = stmt.where(or_(QAQuestion.title.ilike(keyword), QAQuestion.body.ilike(keyword)))

    stmt = stmt.order_by(
        QAQuestion.is_pinned.desc(),
        QAQuestion.status.asc(),
        QAQuestion.is_priority.desc(),
        QAQuestion.last_activity_at.desc(),
    ).offset(offset).limit(limit)

    result = await db.execute(stmt)
    questions = result.scalars().all()
    users_by_id = await _load_users(db, {question.author_id for question in questions})
    return [_question_summary(question, users_by_id) for question in questions]


@router.post("/questions", response_model=QAQuestionOut, status_code=status.HTTP_201_CREATED)
async def create_question_json(
    data: QAQuestionCreate,
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Create a question using JSON payload; image URLs come from /uploads."""
    visibility = _normalize_visibility(data.visibility, user)
    now = datetime.datetime.utcnow()
    question = QAQuestion(
        author_id=user.id,
        title=data.title.strip(),
        body=data.body.strip(),
        images=data.images[:MAX_IMAGES_PER_REQUEST],
        visibility=visibility,
        subject=data.subject.strip()[:100] if data.subject else None,
        tags=_normalize_tags(data.tags),
        is_priority=_is_enrolled(user),
        created_at=now,
        updated_at=now,
        last_activity_at=now,
    )
    db.add(question)
    await db.flush()
    await db.refresh(question)
    users_by_id = {user.id: user}
    summary = _question_summary(question, users_by_id)
    return QAQuestionOut(**summary.model_dump(), answers=[])


@router.post("/questions/form", response_model=QAQuestionOut, status_code=status.HTTP_201_CREATED)
async def create_question_form(
    title: str = Form(...),
    body: str = Form(...),
    visibility: str = Form("public"),
    subject: str | None = Form(None),
    tags: str | None = Form(None),
    files: list[UploadFile] | None = File(None),
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Create a question and upload images in one multipart request."""
    image_urls = await _save_images(files)
    payload = QAQuestionCreate(
        title=title,
        body=body,
        visibility=visibility,
        subject=subject,
        tags=_normalize_tags(tags),
        images=image_urls,
    )
    return await create_question_json(payload, user, db)


@router.get("/questions/{question_id}", response_model=QAQuestionOut)
async def get_question(
    question_id: int,
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get question detail and answers. Public questions are SEO-readable."""
    result = await db.execute(select(QAQuestion).where(QAQuestion.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    await _ensure_can_view_question(question, user)
    await db.execute(
        update(QAQuestion)
        .where(QAQuestion.id == question.id)
        .values(view_count=QAQuestion.view_count + 1)
    )

    answer_result = await db.execute(
        select(QAAnswer)
        .where(QAAnswer.question_id == question_id)
        .order_by(QAAnswer.is_admin_answer.desc(), QAAnswer.created_at.asc())
    )
    answers = answer_result.scalars().all()
    user_ids = {question.author_id, *(answer.author_id for answer in answers)}
    users_by_id = await _load_users(db, user_ids)
    summary = _question_summary(question, users_by_id)
    return QAQuestionOut(
        **summary.model_dump(),
        answers=[_answer_out(answer, users_by_id) for answer in answers],
    )


@router.post("/questions/{question_id}/answers", response_model=QAAnswerOut, status_code=status.HTTP_201_CREATED)
async def create_answer_json(
    question_id: int,
    data: QAAnswerCreate,
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Answer a question. Any logged-in user can answer visible questions."""
    result = await db.execute(select(QAQuestion).where(QAQuestion.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    await _ensure_can_view_question(question, user)

    now = datetime.datetime.utcnow()
    answer = QAAnswer(
        question_id=question_id,
        author_id=user.id,
        body=data.body.strip(),
        images=data.images[:MAX_IMAGES_PER_REQUEST],
        is_admin_answer=user.is_admin,
        created_at=now,
        updated_at=now,
    )
    db.add(answer)
    question.answer_count += 1
    question.last_activity_at = now
    if user.is_admin:
        question.status = "answered"
    await db.flush()
    await db.refresh(answer)
    return _answer_out(answer, {user.id: user})


@router.post("/questions/{question_id}/answers/form", response_model=QAAnswerOut, status_code=status.HTTP_201_CREATED)
async def create_answer_form(
    question_id: int,
    body: str = Form(...),
    files: list[UploadFile] | None = File(None),
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Answer a question and upload images in one multipart request."""
    image_urls = await _save_images(files)
    payload = QAAnswerCreate(body=body, images=image_urls)
    return await create_answer_json(question_id, payload, user, db)


@router.patch("/questions/{question_id}/pin", response_model=QAQuestionSummary)
async def toggle_question_pin(
    question_id: int,
    is_pinned: bool,
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Admin pins/unpins high-value public questions."""
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    result = await db.execute(select(QAQuestion).where(QAQuestion.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    question.is_pinned = is_pinned
    await db.flush()
    await db.refresh(question)
    users_by_id = await _load_users(db, {question.author_id})
    return _question_summary(question, users_by_id)
