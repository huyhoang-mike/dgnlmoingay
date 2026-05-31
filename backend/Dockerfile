# ============================================
# DGNL Backend - FastAPI Dockerfile
# ============================================

FROM python:3.12-slim

WORKDIR /app

# System deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# App source
COPY . .

# Create non-root user. /app and /app/uploads need to be writable for migrations
# and Q&A / materials file uploads. Drop privileges before runtime.
RUN groupadd --system --gid 1001 dgnl \
    && useradd --system --uid 1001 --gid dgnl --home /app --shell /usr/sbin/nologin dgnl \
    && mkdir -p /app/uploads \
    && chown -R dgnl:dgnl /app

USER dgnl

EXPOSE 8000

# Run migrations then start server
# alembic upgrade head: áp dụng tất cả migration chưa chạy
# uvicorn: khởi động FastAPI với multiple workers
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4"]
