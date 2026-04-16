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

EXPOSE 8000

# Production: dùng multiple workers (công thức: 2 * CPU_cores + 1)
# Development: đổi thành --reload nếu cần hot-reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
