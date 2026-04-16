# 🔐 Google OAuth & Quản lý Quyền truy cập — ĐGNL Mỗi Ngày

Hướng dẫn chi tiết cách thiết lập Google OAuth, quản lý quyền truy cập khóa học,
và cấu hình bảo mật cho ứng dụng.

---

## Mục lục

1. [Tổng quan hệ thống xác thực](#1-tổng-quan-hệ-thống-xác-thực)
2. [Thiết lập Google OAuth (Google Cloud Console)](#2-thiết-lập-google-oauth)
3. [Cấu hình biến môi trường](#3-cấu-hình-biến-môi-trường)
4. [Quản lý người dùng & Đăng ký](#4-quản-lý-người-dùng--đăng-ký)
5. [Quyền truy cập nội dung](#5-quyền-truy-cập-nội-dung)
6. [Kết nối với Google Drive](#6-kết-nối-với-google-drive)
7. [API Endpoints cho Admin](#7-api-endpoints-cho-admin)
8. [FAQ & Xử lý sự cố](#8-faq--xử-lý-sự-cố)

---

## 1. Tổng quan hệ thống xác thực

### Luồng xác thực

```
Học sinh click "Đăng nhập bằng Google"
        │
        ▼
Google OAuth → Trả về ID Token
        │
        ▼
Frontend gửi token → POST /api/auth/google
        │
        ▼
Backend xác minh token với Google
        │
        ▼
Tìm/Tạo user trong database
        │
        ▼
Phát hành JWT token → Trả về frontend
        │
        ▼
Frontend lưu JWT → Gửi kèm mọi request
```

### Cấp độ quyền truy cập

| Cấp độ | Mô tả | Quyền |
|--------|--------|-------|
| **Khách** (chưa đăng nhập) | Bất kỳ ai truy cập website | Xem landing page, trang đăng ký, bài học miễn phí (limited) |
| **Đã đăng nhập** (chưa đăng ký khóa) | Đã login Google nhưng chưa thanh toán | Xem danh sách bài học, bài học miễn phí đầy đủ |
| **Đã đăng ký** (`is_enrolled = true`) | Đã thanh toán, admin kích hoạt | Truy cập toàn bộ bài giảng, video, tài liệu |
| **Admin** (`is_admin = true`) | Quản trị viên | Quản lý user, CRUD bài học, enroll/unenroll |

---

## 2. Thiết lập Google OAuth

### Bước 1: Tạo project trên Google Cloud Console

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Đặt tên: `DGNL Moi Ngay`
4. Click **Create**

### Bước 2: Bật API

1. Vào **APIs & Services** → **Library**
2. Tìm và bật **Google Identity Services** (hoặc **Google+ API**)

### Bước 3: Tạo OAuth 2.0 Credentials

1. Vào **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Nếu chưa cấu hình Consent Screen:
   - Chọn **External**
   - Điền tên app: `ĐGNL Mỗi Ngày`
   - Thêm email hỗ trợ
   - Thêm domain (nếu có)
   - **Save and Continue** qua các bước

4. Quay lại tạo OAuth client ID:
   - **Application type**: Web application
   - **Name**: `DGNL Web Client`
   - **Authorized JavaScript origins**:
     ```
     http://localhost
     http://localhost:3000
     https://dgnlmoingay.com
     https://www.dgnlmoingay.com
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost
     http://localhost:3000
     https://dgnlmoingay.com
     https://www.dgnlmoingay.com
     ```
   - Click **Create**

5. **Lưu lại Client ID** (dạng: `xxxx.apps.googleusercontent.com`)

### Bước 4: Cấu hình Consent Screen

1. Vào **OAuth consent screen**
2. Thêm **Test users** (email của bạn) nếu app ở chế độ Testing
3. Khi production, submit để Google review

> ⚠️ **Quan trọng:** Trong chế độ "Testing", chỉ các email được thêm vào Test users mới đăng nhập được. Khi production, cần submit consent screen để tất cả email có thể đăng nhập.

---

## 3. Cấu hình biến môi trường

### File `.env` (thư mục gốc)

```env
# ── Google OAuth ──────────────────────────
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# ── Existing vars ─────────────────────────
DATABASE_URL=postgresql+asyncpg://dgnl_user:dgnl_secret_password_change_me@db:5432/dgnl_db
POSTGRES_USER=dgnl_user
POSTGRES_PASSWORD=dgnl_secret_password_change_me
POSTGRES_DB=dgnl_db

SECRET_KEY=your-super-secret-key-change-me
ALLOWED_ORIGINS=http://localhost,http://localhost:3000,https://dgnlmoingay.com
VITE_API_URL=/api
```

> 📝 **Lưu ý:** `GOOGLE_CLIENT_ID` (backend) và `VITE_GOOGLE_CLIENT_ID` (frontend) phải giống nhau.

### Khi phát triển local (không Docker)

```powershell
# Backend
$env:GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com"
$env:DATABASE_URL = "postgresql+asyncpg://dgnl_user:dgnl_secret@localhost:5432/dgnl_db"
$env:SECRET_KEY = "dev-secret-key"
$env:ALLOWED_ORIGINS = "http://localhost:3000"

# Frontend (.env.local file or terminal)
# Tạo file frontend/.env.local:
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_API_URL=http://localhost:8000/api
```

---

## 4. Quản lý người dùng & Đăng ký

### Quy trình đăng ký học viên

```
1. Học sinh chuyển khoản + gửi email
2. Admin nhận thông tin
3. Học sinh đăng nhập Google trên website (tạo tài khoản tự động)
4. Admin mở trang Quản lý Học viên → click "Cấp quyền"
5. (Tùy chọn) Admin thêm email vào Google Drive folder cho video/PDF
6. Học sinh refresh trang → truy cập đầy đủ nội dung khóa học
```

### Giao diện quản lý học viên (Admin Panel)

Truy cập tại: `https://dgnlmoingay.com/admin` (hoặc `http://localhost:80/admin` khi dev local — yêu cầu đăng nhập admin)

**Cách mở:** Click vào ảnh đại diện (góc phải trên) → chọn **"Quản lý học viên"**

**Các tính năng:**
- 📊 Thống kê: tổng người dùng, đã đăng ký, số admin
- 🔍 Tìm kiếm theo tên hoặc email
- 🏷️ Lọc: Tất cả / Đã ĐK / Chưa ĐK / Admin
- ✅ **Cấp quyền** — cho phép học viên truy cập toàn bộ nội dung
- 🔒 **Thu hồi** — khóa quyền truy cập nội dung
- 🛡️ **Cấp/Gỡ Admin** — thay đổi quyền quản trị

### Cách nhận biết trạng thái học viên

| Vị trí | Đã đăng ký | Chưa đăng ký |
|--------|------------|--------------|
| **Profile dropdown** (Navbar) | 🟢 Badge "Đã đăng ký khóa học" | 🟡 Badge "Chưa đăng ký" |
| **Admin Panel** | 🟢 Badge "Đã đăng ký" | ⚪ Badge "Chưa đăng ký" |
| **Nội dung bài học** | Video + PDF hiển thị đầy đủ | Hiển thị thông báo "Nội dung bị khóa" |

### Enroll học sinh qua Admin Panel (Cách khuyến nghị)

1. Đăng nhập admin trên website
2. Click avatar → **Quản lý học viên**
3. Tìm học viên bằng thanh tìm kiếm
4. Click **"Cấp quyền"** → học viên có thể truy cập mọi nội dung ngay lập tức

### Enroll học sinh qua API (Cách thay thế)

**Cách 1: Qua Swagger UI** (dành cho developer)

1. Đăng nhập admin trước → lấy JWT token
2. Mở `http://localhost/docs`
3. Click 🔒 **Authorize** → paste Bearer token
4. **GET /api/auth/users** → tìm user ID
5. **PUT /api/auth/users/{user_id}/enroll** → kích hoạt

**Cách 2: Qua cURL**

```bash
# 1. Lấy danh sách users
curl -X GET http://localhost/api/auth/users \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# 2. Enroll user (ví dụ user_id = 5)
curl -X PUT http://localhost/api/auth/users/5/enroll \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Cách 3: Qua PowerShell**

```powershell
$token = "YOUR_ADMIN_JWT_TOKEN"
$headers = @{ "Authorization" = "Bearer $token" }

# Lấy danh sách users
Invoke-RestMethod -Uri "http://localhost/api/auth/users" -Headers $headers

# Enroll user
Invoke-RestMethod -Uri "http://localhost/api/auth/users/5/enroll" -Method PUT -Headers $headers
```

### Unenroll học sinh (thu hồi quyền)

```bash
curl -X PUT http://localhost/api/auth/users/5/unenroll \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### Tạo admin đầu tiên

Vì chưa có admin nào, bạn cần thao tác trực tiếp trên database:

```sql
-- Kết nối vào PostgreSQL
-- docker compose exec db psql -U dgnl_user -d dgnl_db

-- Đăng nhập Google trên website trước, sau đó chạy:
UPDATE users SET is_admin = true, is_enrolled = true WHERE email = 'your-email@gmail.com';
```

Hoặc qua Docker:

```bash
docker compose exec db psql -U dgnl_user -d dgnl_db -c \
  "UPDATE users SET is_admin = true, is_enrolled = true WHERE email = 'your-email@gmail.com';"
```

---

## 5. Quyền truy cập nội dung

### Cách hoạt động

Mỗi bài học có trường `is_free`:
- `is_free = true` → Mọi người đều xem được (kể cả khách)
- `is_free = false` → Chỉ user đã enroll/admin mới xem được

Khi user không có quyền, API trả về bài học nhưng **ẩn** các trường nhạy cảm:
- `video_drive_id` → `null`
- `pdf_drive_id` → `null`
- `content` → `null`
- `is_locked` → `true`

Frontend sẽ hiển thị thông báo "Nội dung bị khóa" thay vì video/PDF.

### Đặt bài học miễn phí

```bash
# Đặt bài học ID=1 là miễn phí
curl -X PUT http://localhost/api/lessons/1 \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_free": true}'
```

### Tạo bài học mới với category & subject

```bash
curl -X POST http://localhost/api/lessons/ \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bài 1: Ngữ pháp cơ bản",
    "description": "Ôn tập ngữ pháp tiếng Việt",
    "order": 1,
    "category": "nentang",
    "subject": "tieng_viet",
    "video_drive_id": "GOOGLE_DRIVE_VIDEO_ID",
    "pdf_drive_id": "GOOGLE_DRIVE_PDF_ID",
    "content": "Nội dung bài học...",
    "is_published": true,
    "is_free": false
  }'
```

### Giá trị hợp lệ cho `category`

| Category | Mô tả |
|----------|--------|
| `nentang` | Khóa học Nền tảng (Giai đoạn 1) |
| `luyende` | Khóa học Luyện đề (Giai đoạn 2) |
| `thucchien` | Luyện đề Thực chiến |

### Giá trị hợp lệ cho `subject` (Nền tảng)

| Subject | Môn học |
|---------|--------|
| `tieng_viet` | Tiếng Việt |
| `tieng_anh` | Tiếng Anh |
| `toan` | Toán Phổ Thông |
| `logic` | Logic & Phân tích Số liệu |
| `vat_ly` | Vật Lý |
| `hoa_hoc` | Hóa Học |
| `sinh_hoc` | Sinh Học |
| `dia_ly` | Địa Lý |
| `lich_su` | Lịch Sử |
| `gdktpl` | GD Kinh tế & Pháp luật |
| `nang_cao` | Tài liệu Nâng cao 900+ |

---

## 6. Kết nối với Google Drive

### Quy trình cấp quyền Drive

Khi admin enroll một học sinh:

1. **Trên website:** PUT `/api/auth/users/{id}/enroll` → đánh dấu `is_enrolled = true`
2. **Trên Google Drive:** Thêm email học sinh vào folder chia sẻ

### Cấu hình Google Drive folder

1. Tạo cấu trúc folder trên Drive:
   ```
   📂 ĐGNL Mỗi Ngày/
   ├── 📂 Videos/
   ├── 📂 Materials/
   └── 📂 Exams/
   ```

2. Click chuột phải vào folder gốc → **Chia sẻ**
3. Thêm email học sinh với quyền **Người xem**
4. Hoặc chia sẻ từng sub-folder tùy level

### Script tự động thêm email vào Drive (nâng cao)

Nếu muốn tự động hóa, có thể dùng Google Drive API:

```python
# Ví dụ script (chạy riêng, không phải part of webapp)
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/drive']
SERVICE_ACCOUNT_FILE = 'service-account-key.json'

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)
drive_service = build('drive', 'v3', credentials=credentials)

def share_folder_with_email(folder_id, email):
    permission = {
        'type': 'user',
        'role': 'reader',
        'emailAddress': email
    }
    drive_service.permissions().create(
        fileId=folder_id,
        body=permission,
        sendNotificationEmail=True
    ).execute()
    print(f"Shared folder with {email}")

# Usage
share_folder_with_email('YOUR_FOLDER_ID', 'student@gmail.com')
```

---

## 7. API Endpoints cho Admin

### Authentication

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/auth/google` | Đăng nhập bằng Google token |
| GET | `/api/auth/me` | Lấy thông tin user hiện tại |
| GET | `/api/auth/users` | Danh sách tất cả users (admin) |
| PUT | `/api/auth/users/{id}/enroll` | Cấp quyền truy cập (admin) |
| PUT | `/api/auth/users/{id}/unenroll` | Thu hồi quyền truy cập (admin) |
| PUT | `/api/auth/users/{id}/toggle-admin` | Toggle admin (admin) |

### Lessons (CRUD — yêu cầu admin)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/lessons/?category=nentang&subject=tieng_viet` | Lọc bài học |
| GET | `/api/lessons/?free_only=true` | Chỉ bài học miễn phí |
| POST | `/api/lessons/` | Tạo bài học mới (admin) |
| PUT | `/api/lessons/{id}` | Cập nhật bài học (admin) |
| DELETE | `/api/lessons/{id}` | Xóa bài học (admin) |

---

## 8. FAQ & Xử lý sự cố

### Q: Đăng nhập Google báo lỗi "popup_closed_by_user"?
**A:** Kiểm tra `VITE_GOOGLE_CLIENT_ID` có đúng không. Đảm bảo domain được thêm trong Google Cloud Console → Authorized JavaScript origins.

### Q: Đăng nhập thành công nhưng không thấy nội dung?
**A:** User cần được admin enroll. Kiểm tra `is_enrolled` trong database.

### Q: Làm sao biết user nào đã đăng nhập?
**A:** Dùng API `GET /api/auth/users` (cần admin token) để xem danh sách tất cả users.

### Q: Token hết hạn sau bao lâu?
**A:** Mặc định 60 phút. Thay đổi trong `config.py` → `ACCESS_TOKEN_EXPIRE_MINUTES`.

### Q: Làm sao thay đổi thời gian hết hạn token?
**A:** Thêm biến môi trường `ACCESS_TOKEN_EXPIRE_MINUTES=1440` (24h) vào `.env`.

### Q: Video không hiển thị cho user đã enroll?
**A:** Kiểm tra:
1. `is_enrolled = true` trong database
2. Email đã được thêm vào Google Drive folder
3. File video đã chia sẻ "Bất kỳ ai có link" hoặc chia sẻ riêng cho email

### Q: Làm sao deploy lên production?
**A:** Cập nhật trong Google Cloud Console:
1. Thêm production domain vào Authorized JavaScript origins:
   - `https://dgnlmoingay.com`
   - `https://www.dgnlmoingay.com`
2. Thêm production domain vào Authorized redirect URIs (tương tự)
3. Submit OAuth consent screen cho Google review
4. Cập nhật `.env` trên server với production values

> 📖 Xem thêm: [deployment-guide.md](deployment-guide.md) | [cloudflare-setup.md](cloudflare-setup.md)

---

## Checklist triển khai

- [ ] Tạo Google Cloud project
- [ ] Tạo OAuth 2.0 credentials
- [ ] Cấu hình consent screen
- [ ] Thêm `GOOGLE_CLIENT_ID` vào `.env`
- [ ] Thêm `VITE_GOOGLE_CLIENT_ID` vào `.env`
- [ ] Deploy và test đăng nhập
- [ ] Tạo admin đầu tiên qua SQL
- [ ] Tạo các bài học với category/subject
- [ ] Đặt một số bài học `is_free = true` cho học thử
- [ ] Cấu hình Google Drive folders
- [ ] Test enroll/unenroll qua API
