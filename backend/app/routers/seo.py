"""
ĐGNL Mỗi Ngày - SEO Router
Generates a dynamic XML sitemap that includes published Q&A questions,
open materials and deep-practice quizzes so search engines can index the
long-tail content that grows over time.
"""

import datetime
import json
import os
from pathlib import Path
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.open_material import OpenMaterial
from app.models.qa import QAQuestion

router = APIRouter()

BASE_URL = os.getenv("PUBLIC_BASE_URL", "https://dgnlmoingay.com").rstrip("/")

# Static frontend routes that should always be in the sitemap.
STATIC_ROUTES: list[tuple[str, str, float]] = [
    ("/", "daily", 1.0),
    ("/dang-ky", "weekly", 0.9),
    ("/hoc-thu", "weekly", 0.6),
    ("/nen-tang", "weekly", 0.8),
    ("/luyen-de", "weekly", 0.8),
    ("/luyen-tap-chuyen-sau", "weekly", 0.8),
    ("/hoi-dap", "daily", 0.8),
    ("/kho-tai-lieu-mo", "daily", 0.8),
    ("/thuc-chien", "weekly", 0.7),
]

# Where the frontend stores quiz/exam JSON content.
FRONTEND_PUBLIC = Path(os.getenv("FRONTEND_PUBLIC_DIR", "/app/frontend_public"))


def _fmt(dt: datetime.datetime | None) -> str:
    if not dt:
        return datetime.datetime.utcnow().date().isoformat()
    return dt.date().isoformat()


def _url_entry(loc: str, lastmod: str, changefreq: str, priority: float) -> str:
    return (
        "  <url>\n"
        f"    <loc>{escape(loc)}</loc>\n"
        f"    <lastmod>{lastmod}</lastmod>\n"
        f"    <changefreq>{changefreq}</changefreq>\n"
        f"    <priority>{priority:.1f}</priority>\n"
        "  </url>"
    )


def _load_json_index(rel_path: str) -> list[dict]:
    """Best-effort read of a JSON file shipped with the frontend (sitemap booster)."""
    candidates = [
        FRONTEND_PUBLIC / rel_path,
        Path(__file__).resolve().parents[3] / "frontend" / "public" / rel_path,
    ]
    for path in candidates:
        try:
            if path.is_file():
                with path.open("r", encoding="utf-8") as fp:
                    data = json.load(fp)
                if isinstance(data, list):
                    return data
                if isinstance(data, dict) and isinstance(data.get("items"), list):
                    return data["items"]
        except (OSError, json.JSONDecodeError):
            continue
    return []


@router.get("/sitemap.xml", include_in_schema=False)
async def dynamic_sitemap(db: AsyncSession = Depends(get_db)) -> Response:
    today = datetime.datetime.utcnow().date().isoformat()
    parts: list[str] = ['<?xml version="1.0" encoding="UTF-8"?>',
                        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

    # ── Static pages ───────────────────────────────
    for path, freq, prio in STATIC_ROUTES:
        parts.append(_url_entry(f"{BASE_URL}{path}", today, freq, prio))

    # ── Q&A questions (public + open) ──────────────
    qa_stmt = (
        select(QAQuestion)
        .where(QAQuestion.visibility == "public")
        .order_by(QAQuestion.last_activity_at.desc())
        .limit(2000)
    )
    qa_result = await db.execute(qa_stmt)
    for q in qa_result.scalars().all():
        parts.append(
            _url_entry(
                f"{BASE_URL}/hoi-dap/{q.id}",
                _fmt(q.last_activity_at or q.updated_at or q.created_at),
                "weekly",
                0.6,
            )
        )

    # ── Published open materials ───────────────────
    mat_stmt = (
        select(OpenMaterial)
        .where(OpenMaterial.is_published.is_(True))
        .order_by(OpenMaterial.updated_at.desc())
        .limit(2000)
    )
    mat_result = await db.execute(mat_stmt)
    for m in mat_result.scalars().all():
        parts.append(
            _url_entry(
                f"{BASE_URL}/kho-tai-lieu-mo#material-{m.id}",
                _fmt(m.updated_at or m.created_at),
                "monthly",
                0.6,
            )
        )

    # ── Deep practice quizzes (frontend JSON index) ──
    for quiz in _load_json_index("deep-practice/index.json"):
        slug = quiz.get("id") or quiz.get("slug")
        if not slug:
            continue
        parts.append(
            _url_entry(
                f"{BASE_URL}/luyen-tap-chuyen-sau/{slug}",
                today,
                "monthly",
                0.7,
            )
        )

    # ── Practice exams (frontend JSON index) ─────
    for exam in _load_json_index("exams/index.json"):
        exam_id = exam.get("id")
        if not exam_id:
            continue
        parts.append(
            _url_entry(
                f"{BASE_URL}/thuc-chien/{exam_id}",
                today,
                "monthly",
                0.7,
            )
        )

    parts.append("</urlset>")
    xml = "\n".join(parts)
    return Response(
        content=xml,
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=900"},
    )


@router.get("/robots.txt", include_in_schema=False)
async def robots_txt() -> Response:
    body = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /admin\n"
        "Disallow: /api/\n"
        f"Sitemap: {BASE_URL}/api/seo/sitemap.xml\n"
        f"Sitemap: {BASE_URL}/sitemap.xml\n"
    )
    return Response(content=body, media_type="text/plain")
