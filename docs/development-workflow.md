# 🛠️ Development Workflow — ĐGNL Mỗi Ngày

Hướng dẫn quy trình phát triển, chạy local, test, deploy, và bảo trì ứng dụng.

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Khởi động nhanh (Docker)](#2-khởi-động-nhanh-docker)
3. [Phát triển không cần Docker](#3-phát-triển-không-cần-docker)
4. [Cấu trúc dự án](#4-cấu-trúc-dự-án)
5. [Quy trình phát triển hàng ngày](#5-quy-trình-phát-triển-hàng-ngày)
6. [Git Workflow](#6-git-workflow)
7. [Database Management](#7-database-management)
8. [Thêm tính năng mới](#8-thêm-tính-năng-mới)
9. [Testing](#9-testing)
10. [Production Deployment](#10-production-deployment)
11. [Monitoring & Bảo trì](#11-monitoring--bảo-trì)
12. [Các lệnh hữu ích](#12-các-lệnh-hữu-ích)

---

## 1. Yêu cầu hệ thống

### Bắt buộc
- **Docker Desktop** ≥ 4.x (bao gồm Docker Compose v2)
- **Git** ≥ 2.x

### Khuyến nghị (cho phát triển không Docker)
- **Node.js** ≥ 20.x + npm ≥ 10.x
- **Python** ≥ 3.12 + pip
- **PostgreSQL** 16 (hoặc dùng Docker chỉ cho DB)

### IDE khuyến nghị
- **VS Code** với các extension:
  - Python (ms-python.python)
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Docker
  - Thunder Client hoặc REST Client (test API)

---

## 2. Khởi động nhanh (Docker)

### Lần đầu tiên

```bash
# 1. Clone repository
git clone <your-repo-url> dgnlmoingay
cd dgnlmoingay

# 2. Tạo file environment
cp .env.example .env
# Chỉnh sửa .env nếu cần

# 3. Build và khởi động tất cả services
docker compose up --build -d

# 4. Kiểm tra services đang chạy
docker compose ps

# 5. Xem logs
docker compose logs -f
```

### Sau khi khởi động

| Service         | URL                     | Mô tả                          |
|-----------------|-------------------------|---------------------------------|
| App (Frontend)  | http://localhost        | Giao diện web chính             |
| API Docs        | http://localhost/docs   | Swagger UI — test API           |
| Backend trực tiếp | http://localhost:8000 | FastAPI (bypass nginx)          |
| Database        | localhost:5432          | PostgreSQL (connect bằng tool)  |

### Các lệnh Docker thường dùng

```bash
# Khởi động
docker compose up -d

# Dừng tất cả
docker compose down

# Dừng + xoá volumes (⚠️ xoá database)
docker compose down -v

# Rebuild sau khi thay đổi Dockerfile hoặc dependencies
docker compose up --build -d

# Xem logs realtime
docker compose logs -f backend
docker compose logs -f frontend

# Restart 1 service
docker compose restart backend

# Chạy lệnh trong container
docker compose exec backend bash
docker compose exec db psql -U dgnl_user -d dgnl_db
```

---

## 3. Phát triển không cần Docker

Dùng cách này khi cần hot-reload nhanh hơn hoặc debug sâu hơn.

### 3.1 Database (vẫn dùng Docker cho tiện)

```bash
# Chỉ chạy PostgreSQL
docker compose up -d db
```

### 3.2 Backend

```bash
cd backend

# Tạo virtual environment
python -m venv .venv

# Kích hoạt (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Kích hoạt (macOS/Linux)
source .venv/bin/activate

# Cài dependencies
pip install -r requirements.txt

# Tạo file .env cho backend (hoặc export biến)
# DATABASE_URL phải trỏ về localhost thay vì 'db'
$env:DATABASE_URL = "postgresql+asyncpg://dgnl_user:dgnl_secret_password_change_me@localhost:5432/dgnl_db"
$env:ALLOWED_ORIGINS = "http://localhost:3000,http://localhost"
$env:SECRET_KEY = "dev-secret-key"

# Chạy với hot-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> 📝 **Lưu ý:** Khi chạy ngoài Docker, `DATABASE_URL` phải dùng `localhost` thay vì `db`.

### 3.3 Frontend

```bash
cd frontend

# Cài dependencies
npm install

# Chạy dev server (port 3000, có proxy tới backend)
npm run dev
```

Vite dev server đã được cấu hình proxy `/api` → `http://localhost:8000` trong
`vite.config.js`, nên không cần Nginx khi phát triển local.

### 3.4 Truy cập khi phát triển local

| Service   | URL                      |
|-----------|--------------------------|
| Frontend  | http://localhost:3000    |
| Backend   | http://localhost:8000    |
| API Docs  | http://localhost:8000/docs |

---

## 4. Cấu trúc dự án

```
dgnlmoingay/
├── 📄 docker-compose.yml        # Định nghĩa tất cả services
├── 📄 .env                      # Biến môi trường (KHÔNG commit)
├── 📄 .env.example              # Template cho .env
├── 📄 .gitignore
├── 📄 README.md
│
├── 📂 docs/                     # Tài liệu dự án
│   ├── content-management.md    # Hướng dẫn quản lý nội dung
│   └── development-workflow.md  # File này
│
├── 📂 nginx/
│   └── nginx.conf               # Reverse proxy config
│
├── 📂 backend/                  # ── FastAPI Backend ──
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py              # Entry point, CORS, routers
│       ├── config.py            # Pydantic Settings (env vars)
│       ├── database.py          # Async SQLAlchemy engine
│       ├── models/              # ORM models (DB tables)
│       │   ├── lesson.py        #   → lessons table
│       │   └── progress.py      #   → user_progress table
│       ├── schemas/             # Pydantic schemas (API contracts)
│       │   ├── lesson.py        #   → LessonCreate, LessonOut...
│       │   └── progress.py      #   → ProgressCreate, ProgressOut...
│       └── routers/             # API endpoints
│           ├── lessons.py       #   → CRUD /api/lessons
│           └── progress.py      #   → CRUD /api/progress
│
└── 📂 frontend/                 # ── React Frontend ──
    ├── Dockerfile               # Multi-stage build
    ├── nginx.conf               # SPA internal nginx
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx             # React entry point
        ├── App.jsx              # Router setup
        ├── index.css            # Tailwind + global styles
        ├── api/
        │   └── client.js        # Axios HTTP client
        ├── components/
        │   ├── Layout.jsx       # Sidebar + Outlet shell
        │   ├── Sidebar.jsx      # Lesson navigation
        │   ├── VideoPlayer.jsx  # Google Drive video embed
        │   └── PDFMaterial.jsx  # PDF viewer/download
        └── pages/
            ├── Home.jsx         # Dashboard
            └── LessonView.jsx   # Single lesson view
```

### Quy ước đặt tên

| Loại              | Quy ước                | Ví dụ                   |
|-------------------|------------------------|--------------------------|
| React component   | PascalCase             | `VideoPlayer.jsx`        |
| React page        | PascalCase             | `LessonView.jsx`         |
| API/utility files | camelCase              | `client.js`              |
| Python modules    | snake_case             | `lessons.py`             |
| Python classes    | PascalCase             | `UserProgress`           |
| CSS classes       | Tailwind utility-first | `className="text-lg..."`|

---

## 5. Quy trình phát triển hàng ngày

### Workflow chuẩn

```
1.  git pull origin main         ← Lấy code mới nhất
2.  docker compose up -d         ← Khởi động services
3.  Viết code, thay đổi files
4.  ↻ Backend auto-reload        ← Uvicorn watch (volume mount)
5.  ↻ Frontend rebuild           ← Cần rebuild Docker cho production
6.  Test trên http://localhost
7.  git add → git commit → git push
```

### Hot-reload hoạt động thế nào?

| Service  | Khi dùng Docker                                     | Khi chạy local     |
|----------|------------------------------------------------------|---------------------|
| Backend  | ✅ Auto-reload (volume: `./backend/app:/app/app`)     | ✅ `--reload` flag  |
| Frontend | ❌ Cần `docker compose up --build frontend`           | ✅ Vite HMR instant |
| Database | N/A                                                  | N/A                 |

> 💡 **Mẹo:** Khi phát triển frontend tích cực, chạy `npm run dev` trực tiếp
> (không Docker) để có Vite HMR cực nhanh. Backend vẫn chạy trong Docker.

### Chế độ Hybrid (khuyến nghị khi dev)

```bash
# Chạy DB + Backend trong Docker
docker compose up -d db backend

# Chạy Frontend trực tiếp (HMR nhanh)
cd frontend && npm run dev
```

---

## 6. Git Workflow

### Branch Strategy

```
main              ← Production-ready, luôn deployable
├── develop       ← Integration branch
│   ├── feature/add-quiz-system
│   ├── feature/user-auth
│   └── fix/video-embed-mobile
```

### Commit Convention

```
feat: add quiz system for lessons
fix: video player not rendering on mobile
docs: update content management guide
style: improve sidebar hover animation
refactor: extract API client hooks
chore: update dependencies
```

### Workflow ví dụ

```bash
# 1. Tạo feature branch
git checkout -b feature/add-quiz-system

# 2. Code + commit
git add .
git commit -m "feat: add quiz model and schema"

# 3. Push
git push origin feature/add-quiz-system

# 4. Tạo Pull Request → Review → Merge vào main
```

---

## 7. Database Management

### Truy cập trực tiếp

```bash
# Qua Docker
docker compose exec db psql -U dgnl_user -d dgnl_db

# Từ local (nếu có psql)
psql -h localhost -p 5432 -U dgnl_user -d dgnl_db
```

### Các query hữu ích

```sql
-- Xem tất cả bài học
SELECT id, title, order, is_published, video_drive_id IS NOT NULL AS has_video
FROM lessons ORDER BY "order";

-- Xem progress của 1 user
SELECT l.title, p.progress_percent, p.is_completed
FROM user_progress p
JOIN lessons l ON l.id = p.lesson_id
WHERE p.user_id = 'user_123';

-- Đếm bài học đã publish
SELECT COUNT(*) FROM lessons WHERE is_published = true;

-- Reset tất cả progress (⚠️ cẩn thận)
DELETE FROM user_progress;
```

### Backup & Restore

```bash
# Backup
docker compose exec db pg_dump -U dgnl_user dgnl_db > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20260412.sql | docker compose exec -T db psql -U dgnl_user -d dgnl_db
```

### Schema thay đổi (Migration)

Hiện tại, tables được auto-create khi backend khởi động (qua `lifespan`).
Khi dự án phát triển, nên dùng **Alembic** (đã có trong `requirements.txt`):

```bash
# Khởi tạo Alembic (1 lần)
docker compose exec backend alembic init alembic

# Tạo migration
docker compose exec backend alembic revision --autogenerate -m "add quiz table"

# Áp dụng migration
docker compose exec backend alembic upgrade head
```

---

## 8. Thêm tính năng mới

### 8.1 Thêm API endpoint mới

1. **Model** — Tạo file trong `backend/app/models/`:
   ```python
   # backend/app/models/quiz.py
   class Quiz(Base):
       __tablename__ = "quizzes"
       id: Mapped[int] = mapped_column(Integer, primary_key=True)
       lesson_id: Mapped[int] = mapped_column(Integer, nullable=False)
       question: Mapped[str] = mapped_column(Text, nullable=False)
       # ...
   ```

2. **Schema** — Tạo file trong `backend/app/schemas/`:
   ```python
   # backend/app/schemas/quiz.py
   class QuizCreate(BaseModel):
       lesson_id: int
       question: str
   ```

3. **Router** — Tạo file trong `backend/app/routers/`:
   ```python
   # backend/app/routers/quizzes.py
   router = APIRouter()

   @router.get("/", response_model=list[QuizOut])
   async def list_quizzes(...):
       ...
   ```

4. **Register** — Thêm router vào `backend/app/main.py`:
   ```python
   from app.routers import lessons, progress, quizzes

   app.include_router(quizzes.router, prefix="/api/quizzes", tags=["Quizzes"])
   ```

### 8.2 Thêm trang Frontend mới

1. **Page** — Tạo file trong `frontend/src/pages/`:
   ```jsx
   // frontend/src/pages/QuizView.jsx
   export default function QuizView() {
     return <div>Quiz page</div>;
   }
   ```

2. **Route** — Thêm vào `frontend/src/App.jsx`:
   ```jsx
   import QuizView from './pages/QuizView';

   <Route path="/lessons/:lessonId/quiz" element={<QuizView />} />
   ```

3. **API** — Thêm vào `frontend/src/api/client.js`:
   ```js
   export const getQuizzes = (lessonId) => client.get(`/quizzes/?lesson_id=${lessonId}`);
   ```

### 8.3 Thêm component mới

```
frontend/src/components/
├── Layout.jsx
├── Sidebar.jsx
├── VideoPlayer.jsx
├── PDFMaterial.jsx
└── QuizCard.jsx        ← Thêm ở đây
```

---

## 9. Testing

### Backend — Test API nhanh

```bash
# Health check
curl http://localhost/api/health

# Test CRUD
curl http://localhost/api/lessons/
curl -X POST http://localhost/api/lessons/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Lesson", "order": 99}'
```

### Backend — Unit tests (tương lai)

```bash
# Cài test dependencies
pip install pytest pytest-asyncio httpx

# Chạy tests
pytest tests/ -v
```

### Frontend — Kiểm tra build

```bash
cd frontend
npm run build    # Kiểm tra build production OK
npm run preview  # Preview bản build
```

---

## 10. Production Deployment

> 📖 **Tài liệu triển khai chi tiết** đã được tách thành các file riêng:
>
> | Tài liệu | Nội dung |
> |-----------|----------|
> | [deployment-guide.md](deployment-guide.md) | Tổng quan, quản lý mật khẩu, checklist bảo mật |
> | [vps-setup.md](vps-setup.md) | Cài đặt Hetzner VPS từng bước |
> | [cloudflare-setup.md](cloudflare-setup.md) | CDN + SSL cho học sinh VN |
> | [deployment-concepts.md](deployment-concepts.md) | Giải thích VPS, DNS, SSL, Docker |

### Tóm tắt quy trình deploy

```
1. Mua VPS Hetzner (CX22: 2 vCPU, 4GB RAM, €4.51/tháng)
2. SSH vào VPS, cài Docker
3. Clone code + tạo .env production
4. docker compose up --build -d
5. Thiết lập Cloudflare (DNS + SSL + CDN)
6. Cập nhật Google OAuth cho domain dgnlmoingay.edu.vn
7. Tạo admin đầu tiên
8. Thiết lập backup tự động
```

### Checklist trước khi deploy production

- [ ] Tạo mật khẩu mạnh cho `POSTGRES_PASSWORD` và `SECRET_KEY`
- [ ] `ALLOWED_ORIGINS` = `https://dgnlmoingay.edu.vn`
- [ ] `ENVIRONMENT` = `production` (tắt Swagger docs)
- [ ] Cloudflare SSL mode = Full
- [ ] Google OAuth: thêm `https://dgnlmoingay.edu.vn` vào Authorized Origins
- [ ] Firewall: chỉ mở port 22, 80, 443
- [ ] Test tất cả routes
- [ ] Backup database plan

---

## 11. Monitoring & Bảo trì

### Xem logs

```bash
# Tất cả services
docker compose logs -f

# Chỉ backend
docker compose logs -f backend --tail 100

# Chỉ errors
docker compose logs backend 2>&1 | grep -i error
```

### Kiểm tra health

```bash
# API health
curl -s http://localhost/api/health | python -m json.tool

# Container status
docker compose ps

# Resource usage
docker stats --no-stream
```

### Cập nhật ứng dụng

```bash
cd /opt/dgnlmoingay

# Lấy code mới
git pull origin main

# Rebuild và restart
docker compose up --build -d

# Kiểm tra
docker compose ps
curl http://localhost/api/health
```

### Cập nhật dependencies

```bash
# Backend — cập nhật requirements.txt rồi rebuild
docker compose build --no-cache backend
docker compose up -d backend

# Frontend — cập nhật package.json rồi rebuild
docker compose build --no-cache frontend
docker compose up -d frontend
```

---

## 12. Các lệnh hữu ích

### Docker

| Lệnh                                          | Mô tả                           |
|------------------------------------------------|----------------------------------|
| `docker compose up -d`                         | Khởi động tất cả                 |
| `docker compose down`                          | Dừng tất cả                      |
| `docker compose down -v`                       | Dừng + xoá volumes              |
| `docker compose up --build -d`                 | Rebuild + khởi động              |
| `docker compose logs -f backend`               | Xem log backend realtime         |
| `docker compose exec backend bash`             | Shell vào backend container      |
| `docker compose exec db psql -U dgnl_user -d dgnl_db` | SQL console               |
| `docker compose restart backend`               | Restart 1 service                |
| `docker system prune -a`                       | Dọn images/containers cũ        |

### API Quick Reference

| Method | Endpoint                                    | Mô tả                    |
|--------|---------------------------------------------|---------------------------|
| GET    | `/api/health`                               | Health check              |
| GET    | `/api/lessons/`                             | Danh sách bài học         |
| GET    | `/api/lessons/{id}`                         | Chi tiết 1 bài            |
| POST   | `/api/lessons/`                             | Tạo bài mới               |
| PUT    | `/api/lessons/{id}`                         | Cập nhật bài              |
| DELETE | `/api/lessons/{id}`                         | Xoá bài                   |
| GET    | `/api/progress/user/{user_id}`              | Progress của user         |
| GET    | `/api/progress/user/{uid}/lesson/{lid}`     | Progress 1 bài            |
| POST   | `/api/progress/`                            | Tạo progress              |
| PUT    | `/api/progress/user/{uid}/lesson/{lid}`     | Cập nhật progress         |

### Biến môi trường

| Biến               | Giá trị mặc định                     | Mô tả                    |
|--------------------|---------------------------------------|---------------------------|
| `POSTGRES_USER`    | `dgnl_user`                          | DB username               |
| `POSTGRES_PASSWORD`| (đặt trong .env)                     | DB password               |
| `POSTGRES_DB`      | `dgnl_db`                            | DB name                   |
| `DATABASE_URL`     | `postgresql+asyncpg://...`           | Full connection string    |
| `SECRET_KEY`       | (đặt trong .env)                     | JWT signing key           |
| `ALLOWED_ORIGINS`  | `http://localhost,...`               | CORS origins (phẩy cách)  |
| `VITE_API_URL`     | `http://localhost/api`               | API URL cho frontend      |
| `ENVIRONMENT`      | `development`                        | `production` = tắt Swagger docs |
