"""ĐGNL Mỗi Ngày - FastAPI Application Entry Point"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import auth, lessons, progress, exams, import_lessons, payments, qa, open_materials

# ── Production: tắt Swagger docs ─────────────
_is_production = os.getenv("ENVIRONMENT", "development") == "production"


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
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# ── Static Uploads ───────────────────────────
uploads_root = Path(os.getenv("QA_UPLOAD_ROOT", "/app/uploads"))
uploads_root.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_root)), name="uploads")


# ── Health Check ──────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "app": "ĐGNL Mỗi Ngày"}
