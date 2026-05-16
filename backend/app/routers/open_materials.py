"""
ĐGNL Mỗi Ngày - Open Materials Router
Public Google Drive material catalog plus authenticated community submissions.
"""

import datetime
import os
import re
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, require_admin, require_auth
from app.database import get_db
from app.models.open_material import MaterialSubmission, OpenMaterial
from app.models.user import User
from app.schemas.open_material import (
    MaterialReviewRequest,
    MaterialSubmissionOut,
    OpenMaterialCreate,
    OpenMaterialOut,
)
from app.schemas.qa import QAAuthorOut

router = APIRouter()

UPLOAD_DIR = Path(os.getenv("MATERIAL_UPLOAD_DIR", "/app/uploads/materials"))
UPLOAD_URL_PREFIX = os.getenv("MATERIAL_UPLOAD_URL_PREFIX", "/uploads/materials")
MAX_FILE_BYTES = int(os.getenv("MATERIAL_MAX_FILE_BYTES", str(20 * 1024 * 1024)))
MAX_FILES_PER_REQUEST = int(os.getenv("MATERIAL_MAX_FILES_PER_REQUEST", "5"))
ALLOWED_FILE_TYPES = {
    "application/pdf": (".pdf", "pdf"),
    "image/jpeg": (".jpg", "image"),
    "image/png": (".png", "image"),
    "image/webp": (".webp", "image"),
}


def _is_enrolled(user: User | None) -> bool:
    return bool(user and (user.is_enrolled or user.is_admin))


def _normalize_tags(raw_tags: str | list[str] | None) -> list[str]:
    if not raw_tags:
        return []
    parts = re.split(r"[,#]", raw_tags) if isinstance(raw_tags, str) else raw_tags
    clean_tags = []
    seen = set()
    for tag in parts:
        normalized = str(tag).strip().lower()[:40]
        if normalized and normalized not in seen:
            seen.add(normalized)
            clean_tags.append(normalized)
    return clean_tags[:10]


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


def _material_out(material: OpenMaterial) -> OpenMaterialOut:
    return OpenMaterialOut(
        id=material.id,
        title=material.title,
        description=material.description,
        category=material.category,
        subject=material.subject,
        tags=material.tags or [],
        file_type=material.file_type,
        drive_url=material.drive_url,
        preview_image_url=material.preview_image_url,
        source_name=material.source_name,
        copyright_note=material.copyright_note,
        is_published=material.is_published,
        is_featured=material.is_featured,
        download_count=material.download_count,
        created_at=material.created_at,
        updated_at=material.updated_at,
    )


def _submission_out(submission: MaterialSubmission, users_by_id: dict[int, User]) -> MaterialSubmissionOut:
    contributor = users_by_id.get(submission.contributor_id)
    if not contributor:
        raise HTTPException(status_code=500, detail="Submission contributor not found")
    return MaterialSubmissionOut(
        id=submission.id,
        title=submission.title,
        description=submission.description,
        category=submission.category,
        subject=submission.subject,
        tags=submission.tags or [],
        file_urls=submission.file_urls or [],
        file_types=submission.file_types or [],
        original_filenames=submission.original_filenames or [],
        source_name=submission.source_name,
        copyright_attestation=submission.copyright_attestation,
        copyright_note=submission.copyright_note,
        status=submission.status,
        admin_notes=submission.admin_notes,
        is_priority=submission.is_priority,
        contributor=_author_out(contributor),
        reviewed_at=submission.reviewed_at,
        published_material_id=submission.published_material_id,
        created_at=submission.created_at,
        updated_at=submission.updated_at,
    )


async def _save_files(files: list[UploadFile] | None) -> tuple[list[str], list[str], list[str]]:
    if not files:
        return [], [], []
    if len(files) > MAX_FILES_PER_REQUEST:
        raise HTTPException(status_code=400, detail=f"Upload tối đa {MAX_FILES_PER_REQUEST} file mỗi lần")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    saved_urls = []
    file_types = []
    original_filenames = []

    for file in files:
        if not file.filename:
            continue
        extension_and_type = ALLOWED_FILE_TYPES.get(file.content_type or "")
        if not extension_and_type:
            raise HTTPException(status_code=400, detail="Chỉ hỗ trợ PDF, JPG, PNG hoặc WEBP")

        extension, file_type = extension_and_type
        content = await file.read()
        if len(content) > MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail="Mỗi file tối đa 20MB")

        today = datetime.datetime.utcnow().strftime("%Y/%m")
        target_dir = UPLOAD_DIR / today
        target_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4().hex}{extension}"
        target_path = target_dir / filename
        target_path.write_bytes(content)

        saved_urls.append(f"{UPLOAD_URL_PREFIX}/{today}/{filename}")
        file_types.append(file_type)
        original_filenames.append(file.filename[:255])

    return saved_urls, file_types, original_filenames


@router.get("/materials", response_model=list[OpenMaterialOut])
async def list_materials(
    category: str | None = None,
    subject: str | None = None,
    file_type: str | None = None,
    q: str | None = None,
    featured_only: bool = False,
    published_only: bool = True,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """Public material catalog. Anyone can view/download published Google Drive items."""
    stmt = select(OpenMaterial)
    if published_only or not (user and user.is_admin):
        stmt = stmt.where(OpenMaterial.is_published == True)  # noqa: E712
    if category:
        stmt = stmt.where(OpenMaterial.category == category)
    if subject:
        stmt = stmt.where(OpenMaterial.subject == subject)
    if file_type:
        stmt = stmt.where(OpenMaterial.file_type == file_type)
    if featured_only:
        stmt = stmt.where(OpenMaterial.is_featured == True)  # noqa: E712
    if q:
        keyword = f"%{q.strip()}%"
        stmt = stmt.where(or_(OpenMaterial.title.ilike(keyword), OpenMaterial.description.ilike(keyword)))

    stmt = stmt.order_by(OpenMaterial.is_featured.desc(), OpenMaterial.created_at.desc())
    result = await db.execute(stmt)
    return [_material_out(material) for material in result.scalars().all()]


@router.post("/materials", response_model=OpenMaterialOut, status_code=status.HTTP_201_CREATED)
async def create_material(
    data: OpenMaterialCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin creates a public catalog item pointing to a Google Drive PDF/folder/file."""
    material = OpenMaterial(
        **data.model_dump(exclude={"tags"}),
        tags=_normalize_tags(data.tags),
        created_by_id=admin.id,
    )
    db.add(material)
    await db.flush()
    await db.refresh(material)
    return _material_out(material)


@router.post("/materials/{material_id}/download", response_model=OpenMaterialOut)
async def track_material_download(
    material_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Increment download/open count before frontend redirects to Google Drive."""
    result = await db.execute(select(OpenMaterial).where(OpenMaterial.id == material_id))
    material = result.scalar_one_or_none()
    if not material or not material.is_published:
        raise HTTPException(status_code=404, detail="Material not found")
    await db.execute(
        update(OpenMaterial)
        .where(OpenMaterial.id == material_id)
        .values(download_count=OpenMaterial.download_count + 1)
    )
    material.download_count += 1
    return _material_out(material)


@router.post("/submissions/form", response_model=MaterialSubmissionOut, status_code=status.HTTP_201_CREATED)
async def submit_material_form(
    title: str = Form(...),
    description: str | None = Form(None),
    category: str | None = Form(None),
    subject: str | None = Form(None),
    tags: str | None = Form(None),
    source_name: str | None = Form(None),
    copyright_attestation: bool = Form(False),
    copyright_note: str | None = Form(None),
    files: list[UploadFile] = File(...),
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Authenticated users submit PDFs/images for admin copyright review."""
    if not copyright_attestation:
        raise HTTPException(status_code=400, detail="Bạn cần xác nhận quyền chia sẻ hoặc ghi rõ nguồn tài liệu")
    file_urls, file_types, original_filenames = await _save_files(files)
    if not file_urls:
        raise HTTPException(status_code=400, detail="Vui lòng upload ít nhất một file")

    submission = MaterialSubmission(
        contributor_id=user.id,
        title=title.strip()[:255],
        description=description.strip() if description else None,
        category=category.strip()[:100] if category else None,
        subject=subject.strip()[:100] if subject else None,
        tags=_normalize_tags(tags),
        file_urls=file_urls,
        file_types=file_types,
        original_filenames=original_filenames,
        source_name=source_name.strip()[:255] if source_name else None,
        copyright_attestation=True,
        copyright_note=copyright_note.strip() if copyright_note else None,
        is_priority=_is_enrolled(user),
    )
    db.add(submission)
    await db.flush()
    await db.refresh(submission)
    return _submission_out(submission, {user.id: user})


@router.get("/submissions/me", response_model=list[MaterialSubmissionOut])
async def list_my_submissions(
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MaterialSubmission)
        .where(MaterialSubmission.contributor_id == user.id)
        .order_by(MaterialSubmission.created_at.desc())
    )
    submissions = result.scalars().all()
    return [_submission_out(submission, {user.id: user}) for submission in submissions]


@router.get("/submissions", response_model=list[MaterialSubmissionOut])
async def list_submissions_admin(
    status_filter: str | None = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(MaterialSubmission)
    if status_filter:
        stmt = stmt.where(MaterialSubmission.status == status_filter)
    stmt = stmt.order_by(
        MaterialSubmission.status.asc(),
        MaterialSubmission.is_priority.desc(),
        MaterialSubmission.created_at.desc(),
    )
    result = await db.execute(stmt)
    submissions = result.scalars().all()
    users_by_id = await _load_users(db, {submission.contributor_id for submission in submissions})
    return [_submission_out(submission, users_by_id) for submission in submissions]


@router.patch("/submissions/{submission_id}/review", response_model=MaterialSubmissionOut)
async def review_submission(
    submission_id: int,
    data: MaterialReviewRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MaterialSubmission).where(MaterialSubmission.id == submission_id))
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    submission.status = data.status
    submission.admin_notes = data.admin_notes
    submission.reviewed_by_id = admin.id
    submission.reviewed_at = datetime.datetime.utcnow()

    if data.status == "approved" and data.publish_to_catalog:
        drive_url = data.drive_url or (submission.file_urls[0] if submission.file_urls else None)
        if not drive_url:
            raise HTTPException(status_code=400, detail="Cần Google Drive URL hoặc file đã upload để publish")
        material = OpenMaterial(
            title=submission.title,
            description=submission.description,
            category=submission.category,
            subject=submission.subject,
            tags=submission.tags or [],
            file_type=submission.file_types[0] if submission.file_types else "pdf",
            drive_url=drive_url,
            preview_image_url=next((url for url, kind in zip(submission.file_urls, submission.file_types) if kind == "image"), None),
            source_name=submission.source_name,
            copyright_note=submission.copyright_note,
            is_published=True,
            is_featured=data.is_featured,
            created_by_id=admin.id,
        )
        db.add(material)
        await db.flush()
        await db.refresh(material)
        submission.published_material_id = material.id

    await db.flush()
    await db.refresh(submission)
    users_by_id = await _load_users(db, {submission.contributor_id})
    return _submission_out(submission, users_by_id)
