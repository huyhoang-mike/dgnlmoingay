"""ĐGNL Mỗi Ngày - FastAPI Application Entry Point"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import auth, lessons, progress, exams, import_lessons

# ── Production: tắt Swagger docs ─────────────
_is_production = os.getenv("ENVIRONMENT", "development") == "production"


# ── Lifespan: create tables on startup ────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
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


# ── Health Check ──────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "app": "ĐGNL Mỗi Ngày"}
