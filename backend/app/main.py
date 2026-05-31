"""ĐGNL Mỗi Ngày - FastAPI Application Entry Point"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import auth, lessons, progress, exams, import_lessons, payments, qa, open_materials, notifications, seo

# ── Production: tắt Swagger docs ─────────────
_is_production = os.getenv("ENVIRONMENT", "development") == "production"

# ── Fail-fast: refuse to boot with default secret in production ──
# Defense against accidental deploys with the placeholder JWT key.
_INSECURE_SECRETS = {"change-me-in-production", "", "secret", "changeme"}
if _is_production and (
    settings.SECRET_KEY in _INSECURE_SECRETS or len(settings.SECRET_KEY) < 32
):
    raise RuntimeError(
        "SECRET_KEY is missing, default, or too short for production. "
        "Generate one with `python -c 'import secrets; print(secrets.token_urlsafe(64))'` "
        "and set it via the SECRET_KEY env var."
    )
if _is_production and not settings.ALLOWED_ORIGINS.strip():
    raise RuntimeError("ALLOWED_ORIGINS must be set explicitly in production.")


# ── Lifespan ──────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Alembic handles migrations now (alembic upgrade head)
    # No more Base.metadata.create_all
    yield


# ── App Factory ───────────────────────────────
app = FastAPI(
    title="ĐGNL Mỗi Ngày API",
    description="Course Management API for ĐGNL Mỗi Ngày",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
)

# ── CORS Middleware ───────────────────────────
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    # Restrict to methods we actually serve; "*" + allow_credentials is risky if an
    # unexpected verb is added later.
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
    expose_headers=["Content-Disposition"],
    max_age=600,
)

# ── Routers ───────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(lessons.router, prefix="/api/lessons", tags=["Lessons"])
app.include_router(progress.router, prefix="/api/progress", tags=["User Progress"])
app.include_router(exams.router, prefix="/api/exams", tags=["Exam Settings"])
app.include_router(import_lessons.router, prefix="/api/lessons", tags=["Lesson Import"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(qa.router, prefix="/api/qa", tags=["Q&A"])
app.include_router(open_materials.router, prefix="/api/open-materials", tags=["Open Materials"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(seo.router, prefix="/api/seo", tags=["SEO"])

# ── Static Uploads ───────────────────────────
qa_upload_dir = Path(os.getenv("QA_UPLOAD_DIR", "/app/uploads/qa"))
uploads_root = Path(os.getenv("QA_UPLOAD_ROOT") or str(qa_upload_dir.parent))
uploads_root.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_root)), name="uploads")


# ── Health Check ──────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "app": "ĐGNL Mỗi Ngày"}
