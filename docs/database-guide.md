# Hướng dẫn Quản lý PostgreSQL & Database Migration

---

## 1. Kiến trúc Database hiện tại

```
PostgreSQL 16 (Docker container: dgnl_db)
  └── Database: dgnl_db
        ├── Table: users           ← Học sinh + Admin
        ├── Table: lessons         ← Bài học (nền tảng / luyện đề / thực chiến)
        ├── Table: user_progress   ← Tiến độ học của từng học sinh
        └── Table: exam_settings   ← Cấu hình đề thi
```

### Schema bảng `users`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | Integer (PK) | ID tự tăng |
| `email` | String (unique) | Email Google |
| `name` | String | Tên hiển thị |
| `picture` | String (nullable) | URL ảnh đại diện |
| `google_id` | String (unique) | Google sub ID |
| `enrollment_year` | Integer (nullable) | Năm nhập học (vd: 2026) |
| `course_type` | String (nullable) | Loại khóa: `tu_luyen`, `co_ban`, `nang_cao` |
| `is_enrolled` | Boolean | Đã cấp quyền truy cập |
| `is_admin` | Boolean | Quyền quản trị |
| `created_at` | DateTime | Ngày tạo tài khoản |
| `last_login` | DateTime | Lần đăng nhập gần nhất |

---

## 2. Alembic — Database Migration

Alembic quản lý mọi thay đổi schema database một cách an toàn. Khi backend Docker container khởi động, nó **tự động chạy `alembic upgrade head`** trước khi khởi động FastAPI.

### Cấu trúc file Alembic

```
backend/
├── alembic.ini                          ← File cấu hình
└── alembic/
    ├── env.py                           ← Kết nối DB + load models
    ├── script.py.mako                   ← Template cho migration file
    └── versions/
        └── 001_initial_schema.py        ← Migration đầu tiên
```

### Quy trình thay đổi schema

```bash
# 1. Sửa model Python (vd: thêm cột phone vào user.py)
#    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

# 2. Tạo migration file mới (chạy trên máy local hoặc VPS)
cd backend
DATABASE_URL="postgresql+asyncpg://dgnl_user:password@localhost:5432/dgnl_db" \
  alembic revision --autogenerate -m "add_phone_to_users"

# 3. Kiểm tra file migration vừa tạo trong alembic/versions/
#    Đọc kỹ upgrade() và downgrade() để đảm bảo đúng ý

# 4. Commit + push → VPS tự chạy migration khi docker compose up --build
git add .
git commit -m "feat: add phone field to users"
git push
```

> **Lưu ý:** Trên VPS, migration được chạy tự động trong Dockerfile:
> ```dockerfile
> CMD ["sh", "-c", "alembic upgrade head && uvicorn ..."]
> ```

### Viết migration thủ công (không cần autogenerate)

```bash
cd backend
alembic revision -m "add_phone_to_users"
```

Mở file vừa tạo trong `alembic/versions/` và viết:

```python
def upgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.String(20), nullable=True))

def downgrade() -> None:
    op.drop_column("users", "phone")
```

### Lệnh Alembic hữu ích

```bash
# Xem migration hiện tại
alembic current

# Xem lịch sử migration
alembic history

# Áp dụng tất cả migration
alembic upgrade head

# Rollback 1 migration
alembic downgrade -1

# Rollback về trạng thái ban đầu (xóa tất cả bảng!)
alembic downgrade base
```

---

## 3. Quản lý Database trên VPS

### Truy cập PostgreSQL shell

```bash
ssh mike@<VPS_IP>
cd ~/dgnlmoingay

# Mở psql shell
docker compose exec db psql -U dgnl_user -d dgnl_db
```

### Lệnh psql thường dùng

```sql
-- Xem danh sách bảng
\dt

-- Xem cấu trúc một bảng
\d users
\d lessons

-- Thoát psql
\q
```

### SQL thường dùng

```sql
-- Xem tất cả học sinh
SELECT id, email, name, enrollment_year, course_type, is_enrolled, is_admin
FROM users ORDER BY created_at DESC;

-- Xem tất cả bài học
SELECT id, title, category, subject, is_published, is_free
FROM lessons ORDER BY category, subject, "order";

-- Cấp quyền admin cho một user
UPDATE users SET is_admin = true, is_enrolled = true
WHERE email = 'your@email.com';

-- Cấp quyền enrolled + thông tin khóa học
UPDATE users SET is_enrolled = true, enrollment_year = 2026, course_type = 'nang_cao'
WHERE email = 'student@email.com';

-- Đếm học sinh theo năm nhập học
SELECT enrollment_year, COUNT(*) as total
FROM users WHERE is_enrolled = true
GROUP BY enrollment_year ORDER BY enrollment_year;

-- Đếm học sinh theo loại khóa học
SELECT course_type, COUNT(*) as total
FROM users WHERE is_enrolled = true
GROUP BY course_type;

-- Đếm số bài học theo category
SELECT category, COUNT(*) as total FROM lessons GROUP BY category;

-- Tìm các lesson trùng video_drive_id (khác tên nhưng cùng link/video)
SELECT video_drive_id, COUNT(*) AS total, array_agg(id ORDER BY id) AS lesson_ids
FROM lessons
WHERE video_drive_id IS NOT NULL AND video_drive_id <> ''
GROUP BY video_drive_id
HAVING COUNT(*) > 1;

-- Tìm các lesson trùng pdf_drive_id
SELECT pdf_drive_id, COUNT(*) AS total, array_agg(id ORDER BY id) AS lesson_ids
FROM lessons
WHERE pdf_drive_id IS NOT NULL AND pdf_drive_id <> ''
GROUP BY pdf_drive_id
HAVING COUNT(*) > 1;

-- Xem chi tiết nhóm lesson trùng trước khi xóa
SELECT id, title, category, subject, "order", is_published, is_free, video_drive_id, pdf_drive_id
FROM lessons
WHERE video_drive_id = 'YOUR_VIDEO_ID'
ORDER BY id;

-- Xóa lesson theo ID (ví dụ giữ id=12, xóa các id còn lại)
DELETE FROM lessons WHERE id IN (25, 31);

-- Xóa an toàn theo transaction (có thể rollback nếu kiểm tra thấy sai)
BEGIN;
DELETE FROM lessons WHERE id IN (25, 31);
-- Kiểm tra lại dữ liệu
SELECT id, title FROM lessons WHERE video_drive_id = 'YOUR_VIDEO_ID' ORDER BY id;
COMMIT;
-- Nếu muốn hủy thay đổi thay vì COMMIT thì dùng: ROLLBACK;
```

---

## 4. Xóa Database cũ và bắt đầu mới (Fresh Start)

### Cách 1: Xóa toàn bộ volume (nhanh nhất, xóa sạch hoàn toàn)

```bash
ssh mike@<VPS_IP>
cd ~/dgnlmoingay

# Dừng tất cả containers
docker compose down

# Xóa volume chứa PostgreSQL data
docker volume rm dgnlmoingay_postgres_data

# Khởi động lại — Alembic sẽ tự tạo lại tất cả bảng
docker compose up --build -d

# Kiểm tra log backend
docker compose logs backend --tail 20
# Phải thấy: "Running upgrade  -> 001_initial, initial schema with all tables"
```

### Cách 2: Xóa dữ liệu nhưng giữ bảng

```bash
docker compose exec db psql -U dgnl_user -d dgnl_db -c "
  TRUNCATE TABLE user_progress RESTART IDENTITY CASCADE;
  TRUNCATE TABLE exam_settings RESTART IDENTITY CASCADE;
  TRUNCATE TABLE lessons RESTART IDENTITY CASCADE;
  TRUNCATE TABLE users RESTART IDENTITY CASCADE;
"
```

### Cách 3: Chỉ xóa dữ liệu test, giữ admin

```bash
# Xóa tất cả user KHÔNG phải admin
docker compose exec db psql -U dgnl_user -d dgnl_db -c "
  DELETE FROM user_progress WHERE user_id IN (SELECT id FROM users WHERE is_admin = false);
  DELETE FROM users WHERE is_admin = false;
"
```

---

## 5. Backup & Restore

### Backup (nên làm trước mỗi lần deploy lớn)

```bash
cd ~/dgnlmoingay

# Tạo file backup
docker compose exec db pg_dump -U dgnl_user dgnl_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Nén lại
docker compose exec db pg_dump -U dgnl_user dgnl_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore

```bash
# Restore từ file .sql
docker compose exec -T db psql -U dgnl_user -d dgnl_db < backup_20260416.sql

# Restore từ file .gz
gunzip -c backup_20260416.sql.gz | docker compose exec -T db psql -U dgnl_user -d dgnl_db
```

### Backup tự động (cron job)

```bash
# Tạo thư mục backup
mkdir -p ~/backups

# Mở crontab
crontab -e

# Thêm dòng: backup mỗi ngày lúc 3:00 sáng, giữ 30 ngày
0 3 * * * cd ~/dgnlmoingay && docker compose exec -T db pg_dump -U dgnl_user dgnl_db | gzip > ~/backups/dgnl_$(date +\%Y\%m\%d).sql.gz && find ~/backups -name "dgnl_*.sql.gz" -mtime +30 -delete
```

---

## 6. Giám sát Database

```bash
# Xem dung lượng database
docker compose exec db psql -U dgnl_user -d dgnl_db -c \
  "SELECT pg_size_pretty(pg_database_size('dgnl_db')) AS db_size;"

# Xem dung lượng từng bảng
docker compose exec db psql -U dgnl_user -d dgnl_db -c \
  "SELECT relname AS table_name, pg_size_pretty(pg_total_relation_size(relid)) AS size
   FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC;"

# Xem số lượng record từng bảng
docker compose exec db psql -U dgnl_user -d dgnl_db -c \
  "SELECT 'users' AS tbl, COUNT(*) FROM users
   UNION ALL SELECT 'lessons', COUNT(*) FROM lessons
   UNION ALL SELECT 'user_progress', COUNT(*) FROM user_progress
   UNION ALL SELECT 'exam_settings', COUNT(*) FROM exam_settings;"

# Xem migration hiện tại trên VPS
docker compose exec backend alembic current
```

---

## 7. Troubleshooting

### Lỗi: "relation already exists" khi chạy migration lần đầu

Nếu VPS đã có database cũ (tạo bởi `create_all` trước khi dùng Alembic), các bảng đã tồn tại nên migration sẽ báo lỗi. Giải pháp:

```bash
# Đánh dấu migration đầu tiên là "đã chạy" mà không thực sự chạy SQL
docker compose exec backend alembic stamp 001_initial

# Sau đó, các migration tiếp theo sẽ hoạt động bình thường
```

### Lỗi: Backend không khởi động vì migration fail

```bash
# Xem log chi tiết
docker compose logs backend --tail 50

# Nếu cần, chạy migration thủ công
docker compose exec backend alembic upgrade head
```
