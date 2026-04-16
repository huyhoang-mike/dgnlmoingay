# Hướng dẫn Quản lý PostgreSQL & Database Migration

---

## 1. Kiến trúc Database hiện tại

```
PostgreSQL 16 (Docker container: dgnl_db)
  └── Database: dgnl_db
        ├── Table: users
        ├── Table: lessons
        ├── Table: progress
        └── Table: exam_settings
```

Hiện tại, khi Docker khởi động, FastAPI tự động tạo tất cả các bảng từ SQLAlchemy models thông qua đoạn code trong `main.py`:

```python
# backend/app/main.py
async with engine.begin() as conn:
    await conn.run_sync(Base.metadata.create_all)
```

`create_all` chỉ **tạo bảng nếu chưa tồn tại**. Nó **không bao giờ sửa hay xóa** bảng/cột đã có. Điều này có cả ưu và nhược điểm quan trọng cần hiểu.

---

## 2. Bạn có nên dùng Alembic (Database Migration) không?

**Ngắn gọn: Có, trong tương lai gần.**

Dưới đây là so sánh để bạn quyết định thời điểm phù hợp:

### Không dùng Alembic (Hiện tại)

**✅ Ưu điểm:**
- Đơn giản, không cần cấu hình thêm.
- Phù hợp giai đoạn đầu khi schema còn thay đổi nhiều.
- Dữ liệu sẽ không bị mất vì `create_all` không đụng vào bảng đã có.

**❌ Nhược điểm:**
- **Không thể thêm/sửa/xóa cột tự động.** Nếu bạn thêm cột `thumbnail_url` vào model `Lesson`, bảng trong database sẽ không có cột đó → Backend sẽ báo lỗi.
- Mọi thay đổi schema phải làm **thủ công** bằng câu lệnh SQL.
- Không có lịch sử thay đổi schema.

### Dùng Alembic (Khuyến nghị khi sắp có học sinh thật)

**✅ Ưu điểm:**
- Thêm/sửa/xóa cột tự động và an toàn.
- Có thể rollback (quay lại phiên bản schema cũ).
- Lịch sử thay đổi schema được lưu dưới dạng code (trong `git`).

**❌ Nhược điểm:**
- Cần thêm bước `alembic upgrade head` trong quy trình deploy.
- Cần học thêm cú pháp Alembic.

### Kết luận

| Giai đoạn | Khuyến nghị |
|-----------|-------------|
| Đang phát triển, chưa có dữ liệu thật | `create_all` (hiện tại) — Xóa DB và tạo lại khi cần |
| **Chuẩn bị ra mắt / đã có học sinh đăng ký** | **Chuyển sang Alembic** |

---

## 3. Xử lý thay đổi Schema khi KHÔNG dùng Alembic

Đây là cách thực tế nhất cho giai đoạn hiện tại.

### Trường hợp A: Thêm cột mới vào bảng

Bạn thêm `thumbnail_url` vào `models/lesson.py`. Để database cập nhật:

```bash
# SSH vào VPS
ssh mike@<VPS_IP>
cd ~/dgnlmoingay

# Chạy lệnh SQL trực tiếp vào PostgreSQL trong Docker
docker compose exec db psql -U dgnl_user -d dgnl_db -c \
  "ALTER TABLE lessons ADD COLUMN thumbnail_url VARCHAR(500);"
```

Sau đó deploy code mới bình thường (backend sẽ tự dùng cột mới).

### Trường hợp B: Đổi tên hoặc xóa cột

```bash
# Đổi tên cột
docker compose exec db psql -U dgnl_user -d dgnl_db -c \
  "ALTER TABLE lessons RENAME COLUMN pdf_drive_id TO pdf_id;"

# Xóa cột (cẩn thận! Không thể hoàn tác)
docker compose exec db psql -U dgnl_user -d dgnl_db -c \
  "ALTER TABLE lessons DROP COLUMN old_column_name;"
```

### Trường hợp C: Xóa toàn bộ và tạo lại (chỉ khi chưa có dữ liệu)

```bash
# ⚠️ Cẩn thận: xóa toàn bộ dữ liệu!
docker compose down
docker volume rm dgnlmoingay_postgres_data
docker compose up --build -d
# FastAPI sẽ tự tạo lại tất cả các bảng theo model mới
```

---

## 4. Các lệnh PostgreSQL thường dùng

### Truy cập PostgreSQL shell (psql)

```bash
# Trên VPS
docker compose exec db psql -U dgnl_user -d dgnl_db

# Trên máy local (nếu đã mở port 5432)
psql -h localhost -U dgnl_user -d dgnl_db
```

### Các lệnh trong psql shell

```sql
-- Xem danh sách bảng
\dt

-- Xem cấu trúc một bảng
\d lessons
\d users

-- Thoát psql
\q
```

### Các lệnh SQL thường dùng

```sql
-- Xem tất cả bài học
SELECT id, title, category, subject, is_published, is_free FROM lessons ORDER BY id;

-- Xem tất cả users
SELECT id, email, is_admin, is_enrolled, created_at FROM users ORDER BY created_at DESC;

-- Cấp quyền admin cho một user
UPDATE users SET is_admin = true, is_enrolled = true WHERE email = 'your@email.com';

-- Thu hồi quyền enrolled
UPDATE users SET is_enrolled = false WHERE email = 'student@email.com';

-- Đếm số bài học theo category
SELECT category, COUNT(*) as total FROM lessons GROUP BY category;

-- Xóa một bài học theo ID
DELETE FROM lessons WHERE id = 5;

-- Xóa toàn bộ bài học (giữ lại bảng)
TRUNCATE TABLE lessons RESTART IDENTITY;
```

---

## 5. Backup & Restore Database

### Backup (nên làm trước mỗi lần deploy lớn)

```bash
# Tạo file backup
docker compose exec db pg_dump -U dgnl_user dgnl_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Nén lại để tiết kiệm dung lượng
docker compose exec db pg_dump -U dgnl_user dgnl_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore

```bash
# Restore từ file .sql
docker compose exec -T db psql -U dgnl_user -d dgnl_db < backup_20260416.sql

# Restore từ file .gz
gunzip -c backup_20260416.sql.gz | docker compose exec -T db psql -U dgnl_user -d dgnl_db
```

---

## 6. Thiết lập Alembic (khi sẵn sàng)

Alembic đã có trong `requirements.txt`. Khi bạn quyết định dùng, làm theo các bước sau:

### Bước 1: Khởi tạo Alembic (chỉ làm một lần)

```bash
# Trên máy local, trong thư mục backend/
cd backend
alembic init alembic
```

Lệnh này tạo ra:
```
backend/
  alembic/
    env.py          ← Cần chỉnh sửa
    versions/       ← Các file migration sẽ nằm ở đây
  alembic.ini       ← File cấu hình
```

### Bước 2: Cấu hình `alembic/env.py`

```python
# Thêm vào đầu file env.py
import asyncio
from app.database import Base
from app.models import lesson, user, progress, exam_setting  # import để detect models
from app.config import settings

# Cập nhật dòng target_metadata
target_metadata = Base.metadata

# Cập nhật dòng config url
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
```

### Bước 3: Tạo migration file đầu tiên

```bash
# Tạo migration từ các model hiện tại
alembic revision --autogenerate -m "initial_schema"
# → Tạo file alembic/versions/xxxx_initial_schema.py
```

### Bước 4: Chạy migration

```bash
# Áp dụng tất cả migration chưa chạy
alembic upgrade head

# Trên VPS (chạy bên trong container backend)
docker compose exec backend alembic upgrade head
```

### Quy trình khi thay đổi schema (sau khi dùng Alembic)

```bash
# 1. Sửa model trong Python (vd: thêm cột thumbnail_url vào lesson.py)

# 2. Tạo file migration mới
alembic revision --autogenerate -m "add_thumbnail_to_lessons"

# 3. Kiểm tra file migration vừa tạo trong alembic/versions/
# Đọc kỹ để đảm bảo đúng ý

# 4. Chạy migration trên production
docker compose exec backend alembic upgrade head
```

---

## 7. Giám sát & Kiểm tra sức khỏe Database

```bash
# Xem dung lượng database
docker compose exec db psql -U dgnl_user -d dgnl_db -c \
  "SELECT pg_size_pretty(pg_database_size('dgnl_db')) AS db_size;"

# Xem dung lượng từng bảng
docker compose exec db psql -U dgnl_user -d dgnl_db -c \
  "SELECT relname AS table, pg_size_pretty(pg_total_relation_size(relid)) AS size
   FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC;"

# Kiểm tra kết nối hiện tại
docker compose exec db psql -U dgnl_user -d dgnl_db -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname = 'dgnl_db';"

# Xem Docker volume
docker volume inspect dgnlmoingay_postgres_data
```
