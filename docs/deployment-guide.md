# 🚀 Hướng dẫn Triển khai — ĐGNL Mỗi Ngày

> **Domain:** `dgnlmoingay.com`
> **VPS:** Hetzner Cloud (Falkenstein/Nuremberg, Đức)
> **CDN/SSL:** Cloudflare (tăng tốc cho học sinh Việt Nam)
> **Stack:** Docker Compose — PostgreSQL + FastAPI + React + Nginx

---

## Mục lục

1. [Tổng quan kiến trúc Production](#1-tổng-quan-kiến-trúc-production)
2. [Quản lý mật khẩu & biến môi trường](#2-quản-lý-mật-khẩu--biến-môi-trường)
3. [Bảo mật Production Checklist](#3-bảo-mật-production-checklist)
4. [Tài liệu liên quan](#4-tài-liệu-liên-quan)

---

## 1. Tổng quan kiến trúc Production

```
Học sinh (Việt Nam)
        │
        ▼
Cloudflare CDN (PoP tại Việt Nam — cache + SSL + DDoS protection)
        │
        ▼ (HTTPS → HTTP, header CF-Connecting-IP)
Hetzner VPS (Đức — dgnlmoingay.com)
        │
        ▼
┌─── Docker Compose ──────────────────────────────┐
│                                                   │
│  Nginx Reverse Proxy (:80)                       │
│    ├── /api/*   → FastAPI Backend (:8000)        │
│    └── /*       → React Frontend (:80 internal)  │
│                                                   │
│  PostgreSQL (:5432 — chỉ nội bộ Docker)          │
└───────────────────────────────────────────────────┘
```

### Tại sao Hetzner + Cloudflare?

| Yếu tố | Chi tiết |
|---------|----------|
| **Hetzner** | Giá rẻ (€4-10/tháng), cấu hình tốt, hạ tầng mature ở châu Âu |
| **Cloudflare** | CDN miễn phí với PoP tại Việt Nam → latency giảm từ ~200ms xuống ~30-50ms |
| **Kết hợp** | Hetzner lo processing, Cloudflare lo caching + SSL + tốc độ cho VN |

---

## 2. Quản lý mật khẩu & biến môi trường

### 2.1 Hiểu về file `.env`

File `.env` chứa **tất cả** cấu hình nhạy cảm của hệ thống. Nó **KHÔNG BAO GIỜ** được commit lên GitHub.

Trong repo có file `.env.example` — đây là **template** với giá trị giả (placeholder). Khi deploy, bạn sẽ:
1. Copy `.env.example` → `.env`
2. Thay các giá trị giả bằng giá trị thật

### 2.2 Phân loại mức độ nhạy cảm

| Biến | Mức độ | Giải thích |
|------|--------|------------|
| `POSTGRES_PASSWORD` | 🔴 **Cực kỳ nhạy cảm** | Mật khẩu truy cập database — lộ = mất toàn bộ dữ liệu |
| `SECRET_KEY` | 🔴 **Cực kỳ nhạy cảm** | Khóa ký JWT token — lộ = giả mạo được token của bất kỳ ai |
| `DATABASE_URL` | 🔴 **Cực kỳ nhạy cảm** | Chứa password bên trong chuỗi kết nối |
| `SEPAY_WEBHOOK_SECRET` | 🔴 **Cực kỳ nhạy cảm** | Secret xác minh webhook SePay — lộ = có thể giả webhook thanh toán |
| `GOOGLE_CLIENT_ID` | 🟢 **Public** | Google thiết kế để public, không phải secret |
| `VITE_GOOGLE_CLIENT_ID` | 🟢 **Public** | Nằm trong JS bundle, ai cũng thấy được |
| `VITE_API_URL` | 🟢 **Public** | Chỉ là URL path `/api` |
| `BANK_ACCOUNT_NUMBER` | 🟡 **Ít nhạy cảm** | Dùng để nhận tiền, có thể công khai trên trang thanh toán |
| `ALLOWED_ORIGINS` | 🟡 **Ít nhạy cảm** | Nhưng phải đúng domain để chặn CORS attack |

### 2.3 Cách tạo mật khẩu mạnh

Chạy trên VPS hoặc máy local:

```bash
# Tạo POSTGRES_PASSWORD (32 ký tự hex ngẫu nhiên)
openssl rand -hex 16
# Ví dụ kết quả: a1b2c3d4e5f6789012345678abcdef90

# Tạo SECRET_KEY (64 ký tự hex ngẫu nhiên)
openssl rand -hex 32
# Ví dụ kết quả: e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8
```

### 2.4 ⭐ Giải thích `DATABASE_URL` và `<same-password>`

`DATABASE_URL` là chuỗi kết nối database có cấu trúc:

```
postgresql+asyncpg://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

**`PASSWORD` trong `DATABASE_URL` PHẢI giống hệt `POSTGRES_PASSWORD`** vì cả hai đều truy cập cùng 1 database:

```env
# ❌ SAI — 2 password khác nhau → backend không kết nối được DB
POSTGRES_PASSWORD=abc123
DATABASE_URL=postgresql+asyncpg://dgnl_user:xyz789@db:5432/dgnl_db

# ✅ ĐÚNG — cùng 1 password
POSTGRES_PASSWORD=a1b2c3d4e5f6789012345678abcdef90
DATABASE_URL=postgresql+asyncpg://dgnl_user:a1b2c3d4e5f6789012345678abcdef90@db:5432/dgnl_db
```

### 2.5 Hướng dẫn tạo file `.env` production từng bước

```bash
# Bước 1: Copy template
cp .env.example .env

# Bước 2: Tạo mật khẩu
DB_PASS=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
echo "DB Password:  $DB_PASS"
echo "JWT Secret:   $JWT_SECRET"

# Bước 3: Chỉnh sửa file .env
nano .env
```

Nội dung `.env` production hoàn chỉnh:

```env
# ── Database ──────────────────────────────────
POSTGRES_USER=dgnl_user
POSTGRES_PASSWORD=a1b2c3d4e5f6789012345678abcdef90
POSTGRES_DB=dgnl_db
DATABASE_URL=postgresql+asyncpg://dgnl_user:a1b2c3d4e5f6789012345678abcdef90@db:5432/dgnl_db

# ── Security ─────────────────────────────────
SECRET_KEY=e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8
ALLOWED_ORIGINS=https://dgnlmoingay.com,https://www.dgnlmoingay.com

# ── Google OAuth ─────────────────────────────
GOOGLE_CLIENT_ID=your-real-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your-real-client-id.apps.googleusercontent.com

# ── Frontend ─────────────────────────────────
VITE_API_URL=/api

# ── Payments (SePay) ─────────────────────────
PAYMENT_PROVIDER=sepay
PAYMENT_ORDER_PREFIX=DGNL
PAYMENT_ORDER_EXPIRY_MINUTES=60
COURSE_PRICE_VND=599000
SEPAY_WEBHOOK_HEADER=x-sepay-token
SEPAY_WEBHOOK_SECRET=replace-with-long-random-secret

# ── Bank Receive Info (VietQR) ───────────────
BANK_NAME=TP BANK
BANK_BIN=970423
BANK_ACCOUNT_NUMBER=04351047435
BANK_ACCOUNT_NAME=NGUYEN HUY HOANG

# ── Post-payment Links ───────────────────────
COURSE_ZALO_GROUP_URL=https://zalo.me/g/your-real-group-link
COURSE_YOUTUBE_GUIDE_URL=https://www.youtube.com/watch?v=your-real-video
SUPPORT_ZALO_URL=https://zalo.me/0355912940

# ── Environment ──────────────────────────────
ENVIRONMENT=production
```

> ⚠️ **Quan trọng:** Thay `a1b2c3d4...` bằng giá trị bạn vừa tạo ở Bước 2. Đây chỉ là ví dụ!

### 2.6 Lưu giữ mật khẩu an toàn

Sau khi tạo `.env` trên VPS, **lưu lại mật khẩu** ở nơi an toàn:

| Cách | Mô tả | Khuyến nghị |
|------|--------|-------------|
| **Password Manager** | Bitwarden, 1Password, KeePass | ⭐ Tốt nhất |
| **Ghi chú mã hóa** | Lưu trong Notes app có mật khẩu | ✅ Chấp nhận được |
| **File text trên máy** | File .txt trên máy local | ⚠️ Nhớ không upload lên đâu |
| **Dán trong code/Git** | Hardcode hoặc commit .env | ❌ **TUYỆT ĐỐI KHÔNG** |

### 2.7 Khi nào cần đổi mật khẩu?

| Tình huống | Hành động |
|-----------|-----------|
| Nghi ngờ `.env` bị lộ | Đổi `SECRET_KEY` + `POSTGRES_PASSWORD` ngay lập tức |
| Định kỳ mỗi 3-6 tháng | Đổi `SECRET_KEY` (user cần login lại) |
| Thêm/xóa người quản trị | Đổi nếu người cũ có quyền truy cập VPS |

---

## 3. Bảo mật Production Checklist

### Hạ tầng (Infrastructure)

- [ ] **SSL/HTTPS** — Cloudflare xử lý (xem [cloudflare-setup.md](cloudflare-setup.md))
- [ ] **Firewall** — Chỉ mở port 22, 80, 443 (xem [vps-setup.md](vps-setup.md))
- [ ] **SSH Key-based login** — Tắt password SSH
- [ ] **Fail2Ban** — Chặn brute-force SSH
- [ ] **DB/Backend không expose port ra ngoài** — ✅ Đã cấu hình trong docker-compose.yml
- [ ] **Cập nhật OS & Docker** thường xuyên

### Ứng dụng (Application)

- [ ] **CORS** — `ALLOWED_ORIGINS` chỉ chứa `https://dgnlmoingay.com`
- [ ] **JWT Secret** — Random ≥ 64 chars ✅
- [ ] **Rate Limiting** — Nginx đã cấu hình 10 req/s cho API ✅
- [ ] **Security Headers** — Nginx đã thêm ✅
- [ ] **Swagger docs tắt** — `ENVIRONMENT=production` tự tắt ✅
- [ ] **Webhook Secret** — `SEPAY_WEBHOOK_SECRET` đủ mạnh, không để trống
- [ ] **Input Validation** — Pydantic schemas ✅ có sẵn
- [ ] **SQL Injection** — SQLAlchemy ORM ✅ có sẵn
- [ ] **XSS** — React tự escape ✅ có sẵn

### Dữ liệu (Data)

- [ ] **Backup database tự động** — Crontab hàng ngày (xem [vps-setup.md](vps-setup.md))
- [ ] **Database password mạnh** — Random ≥ 32 chars
- [ ] **File `.env` không commit Git** — .gitignore đã cấu hình ✅

---

## 4. Tài liệu liên quan

| Tài liệu | Nội dung |
|-----------|----------|
| 📋 [vps-setup.md](vps-setup.md) | **Hướng dẫn cài đặt VPS Hetzner từng bước** — SSH, Docker, deploy, backup |
| ☁️ [cloudflare-setup.md](cloudflare-setup.md) | **Thiết lập Cloudflare CDN + SSL** — tăng tốc cho học sinh VN |
| 📖 [deployment-concepts.md](deployment-concepts.md) | **Giải thích các khái niệm** — VPS, DNS, SSL, Docker, Firewall |
| 🔐 [google-auth-setup.md](google-auth-setup.md) | Thiết lập Google OAuth, quản lý quyền truy cập |
| 💳 [sepay-payment-system.md](sepay-payment-system.md) | Kiến trúc thanh toán tự động SePay + runbook vận hành |
| 🛠️ [development-workflow.md](development-workflow.md) | Quy trình phát triển local |
| 📚 [content-management.md](content-management.md) | Quản lý video, PDF, bài học |
