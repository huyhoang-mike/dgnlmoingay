"""
ĐGNL Mỗi Ngày - Bulk Import Router
Import lessons from CSV/XLSX files for initial content setup.
"""

import csv
import io
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.lesson import Lesson
from app.models.user import User
from app.auth import require_admin

router = APIRouter()


# ── Expected CSV/XLSX columns ─────────────────
# title           (bắt buộc) — Tên bài học
# description     (tuỳ chọn) — Mô tả
# order           (tuỳ chọn) — Thứ tự hiển thị (mặc định 0)
# category        (tuỳ chọn) — nentang | luyende | thucchien (mặc định nentang)
# subject         (tuỳ chọn) — tieng_viet, toan, ly, hoa, ...
# video_drive_id  (tuỳ chọn) — Google Drive video file ID (trống = không có video)
# pdf_drive_id    (tuỳ chọn) — Google Drive PDF file ID (trống = không có tài liệu)
# content         (tuỳ chọn) — Nội dung bài học (Markdown/HTML)
# is_published    (tuỳ chọn) — true/false (mặc định false)
# is_free         (tuỳ chọn) — true/false (mặc định false)


def _parse_bool(value: str) -> bool:
    """Parse various boolean representations."""
    if not value:
        return False
    return str(value).strip().lower() in ("true", "1", "yes", "có", "x")


def _parse_int(value: str, default: int = 0) -> int:
    """Parse integer with default."""
    if not value:
        return default
    try:
        return int(float(str(value).strip()))
    except (ValueError, TypeError):
        return default


def _clean_str(value) -> Optional[str]:
    """Clean string value, return None if empty."""
    if value is None:
        return None
    s = str(value).strip()
    return s if s else None


# Regex patterns for Google Drive URLs
_DRIVE_PATTERNS = [
    # https://drive.google.com/file/d/FILE_ID/view
    re.compile(r"drive\.google\.com/file/d/([a-zA-Z0-9_-]+)"),
    # https://drive.google.com/open?id=FILE_ID
    re.compile(r"drive\.google\.com/open\?id=([a-zA-Z0-9_-]+)"),
    # https://docs.google.com/document/d/FILE_ID/edit
    re.compile(r"docs\.google\.com/\w+/d/([a-zA-Z0-9_-]+)"),
    # https://drive.google.com/uc?id=FILE_ID&export=download
    re.compile(r"drive\.google\.com/uc\?id=([a-zA-Z0-9_-]+)"),
]


def _extract_drive_id(value: Optional[str]) -> Optional[str]:
    """
    Extract Google Drive file ID from a URL or return as-is if already an ID.

    Accepts:
    - Full URL: https://drive.google.com/file/d/1aBcDeFg/view
    - Short URL: https://drive.google.com/open?id=1aBcDeFg
    - Plain ID:  1aBcDeFg
    - Empty/None → None
    """
    if not value:
        return None
    value = value.strip()
    if not value:
        return None

    # If it looks like a URL, try to extract the ID
    if "google.com" in value:
        for pattern in _DRIVE_PATTERNS:
            match = pattern.search(value)
            if match:
                return match.group(1)
        # URL but no match — return as-is (user might know what they're doing)
        return value

    # Already a plain ID
    return value


def _parse_rows(rows: list[dict]) -> list[dict]:
    """Parse raw CSV/XLSX rows into lesson data dicts."""
    lessons = []
    for i, row in enumerate(rows, start=2):  # row 1 = header
        # Normalize keys: strip whitespace, lowercase
        row = {str(k).strip().lower().replace(" ", "_"): v for k, v in row.items()}

        title = _clean_str(row.get("title"))
        if not title:
            continue  # Skip rows without title

        lesson = {
            "title": title,
            "description": _clean_str(row.get("description")),
            "order": _parse_int(row.get("order"), default=i),
            "category": _clean_str(row.get("category")) or "nentang",
            "subject": _clean_str(row.get("subject")),
            "video_drive_id": _extract_drive_id(row.get("video_drive_id")),
            "pdf_drive_id": _extract_drive_id(row.get("pdf_drive_id")),
            "content": _clean_str(row.get("content")),
            "is_published": _parse_bool(row.get("is_published", "")),
            "is_free": _parse_bool(row.get("is_free", "")),
        }
        lessons.append(lesson)

    return lessons


def _read_csv(content: bytes) -> list[dict]:
    """Read CSV content into list of dicts."""
    # Try UTF-8 first, fall back to UTF-8-sig (for Excel CSV), then latin-1
    for encoding in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            text = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise ValueError("Không thể đọc file CSV. Hãy lưu file với encoding UTF-8.")

    reader = csv.DictReader(io.StringIO(text))
    return list(reader)


def _read_xlsx(content: bytes) -> list[dict]:
    """Read XLSX content into list of dicts."""
    try:
        import openpyxl
    except ImportError:
        raise ValueError(
            "Cần cài thư viện openpyxl để đọc file XLSX. "
            "Thêm 'openpyxl' vào requirements.txt."
        )

    wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    ws = wb.active
    rows_iter = ws.iter_rows(values_only=True)

    # First row = headers
    try:
        headers = [str(h).strip() if h else f"col_{i}" for i, h in enumerate(next(rows_iter))]
    except StopIteration:
        return []

    result = []
    for row in rows_iter:
        row_dict = {}
        for h, val in zip(headers, row):
            row_dict[h] = str(val).strip() if val is not None else ""
        result.append(row_dict)

    wb.close()
    return result


# ── Import endpoint ───────────────────────────
@router.post("/import", status_code=status.HTTP_201_CREATED)
async def import_lessons(
    file: UploadFile = File(...),
    mode: str = "skip",  # skip | overwrite | append
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Import lessons from CSV or XLSX file.

    **Mode:**
    - `skip` (mặc định): Bỏ qua bài học đã tồn tại (cùng title + category + subject)
    - `overwrite`: Cập nhật bài học đã tồn tại
    - `append`: Luôn tạo mới, không kiểm tra trùng

    **File format:** CSV hoặc XLSX với các cột:
    `title`, `description`, `order`, `category`, `subject`,
    `video_drive_id`, `pdf_drive_id`, `content`, `is_published`, `is_free`

    - Cột `title` là bắt buộc, các cột khác tuỳ chọn.
    - Nếu `video_drive_id` trống → bài học không có bài giảng video.
    - Nếu `pdf_drive_id` trống → bài học không có tài liệu PDF.
    """
    if mode not in ("skip", "overwrite", "append"):
        raise HTTPException(status_code=400, detail="Mode phải là: skip, overwrite, hoặc append")

    # Read file content
    content = await file.read()
    filename = file.filename or ""

    # Parse based on file type
    try:
        if filename.endswith(".xlsx"):
            raw_rows = _read_xlsx(content)
        elif filename.endswith(".csv"):
            raw_rows = _read_csv(content)
        else:
            raise HTTPException(
                status_code=400,
                detail="Chỉ hỗ trợ file .csv hoặc .xlsx"
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not raw_rows:
        raise HTTPException(status_code=400, detail="File rỗng hoặc không có dữ liệu")

    lessons_data = _parse_rows(raw_rows)
    if not lessons_data:
        raise HTTPException(status_code=400, detail="Không tìm thấy bài học hợp lệ (cần cột 'title')")

    created = 0
    updated = 0
    skipped = 0

    for data in lessons_data:
        if mode != "append":
            # Check for existing lesson by title + category + subject
            query = select(Lesson).where(
                Lesson.title == data["title"],
                Lesson.category == data["category"],
            )
            if data["subject"]:
                query = query.where(Lesson.subject == data["subject"])

            result = await db.execute(query)
            existing = result.scalar_one_or_none()

            if existing:
                if mode == "skip":
                    skipped += 1
                    continue
                elif mode == "overwrite":
                    for key, value in data.items():
                        if key != "title":  # Don't overwrite title
                            setattr(existing, key, value)
                    updated += 1
                    continue

        # Create new lesson
        lesson = Lesson(**data)
        db.add(lesson)
        created += 1

    await db.flush()

    return {
        "message": f"Import hoàn tất: {created} tạo mới, {updated} cập nhật, {skipped} bỏ qua",
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "total_rows": len(lessons_data),
    }


# ── Export endpoint (for reference/backup) ────
@router.get("/export")
async def export_lessons(
    category: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Export all lessons as JSON (có thể dùng để backup hoặc tham khảo cấu trúc).
    """
    query = select(Lesson).order_by(Lesson.category, Lesson.subject, Lesson.order)
    if category:
        query = query.where(Lesson.category == category)

    result = await db.execute(query)
    lessons = result.scalars().all()

    return [
        {
            "title": l.title,
            "description": l.description,
            "order": l.order,
            "category": l.category,
            "subject": l.subject,
            "video_drive_id": l.video_drive_id,
            "pdf_drive_id": l.pdf_drive_id,
            "content": l.content,
            "is_published": l.is_published,
            "is_free": l.is_free,
        }
        for l in lessons
    ]
