# ĐGNL Mỗi Ngày — Course Management Web App

> Ứng dụng quản lý khoá học "ĐGNL Mỗi Ngày" – xây dựng bằng **React + Vite + Tailwind CSS** (Frontend), **FastAPI** (Backend), **PostgreSQL** (Database), và **Nginx** (Reverse Proxy). Hỗ trợ **Dark/Light mode**, **Google OAuth**, và **quản lý quyền truy cập** nội dung. Triển khai trên **Hetzner VPS** với **Docker Compose** & **Cloudflare CDN**.
>
> 🌐 **Production:** [https://dgnlmoingay.com](https://dgnlmoingay.com)

**Ngôn ngữ:** Tiếng Việt | [English](README.md)

---

## 📁 Project Structure

```
dgnlmoingay/
├── docker-compose.yml
├── .env                        # Environment variables (not committed)
├── nginx/
│   └── nginx.conf              # Reverse proxy
├── docs/
│   ├── info.md                 # Course content info
│   ├── content-management.md   # Content management guide
│   ├── development-workflow.md # Development workflow
│   ├── google-auth-setup.md   # 🔐 Google OAuth & access control guide
│   └── sepay-payment-system.md # 💳 SePay auto-payment architecture + operations
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js      # Dark mode enabled
│   └── src/
│       ├── main.jsx            # Google OAuth + Theme + Auth providers
│       ├── App.jsx             # Multi-page routing
│       ├── index.css           # Dark mode styles
│       ├── api/client.js       # Axios + JWT interceptors
│       ├── contexts/
│       │   ├── ThemeContext.jsx # Dark/Light mode
│       │   └── AuthContext.jsx # Google auth state
│       ├── components/
│       │   ├── Layout.jsx      # Navbar + Footer layout
│       │   ├── Navbar.jsx      # Navigation + theme + auth
│       │   ├── Footer.jsx
│       │   ├── Sidebar.jsx     # Lesson sidebar
│       │   ├── ExamTake.jsx    # Mock exam engine
│       │   ├── VideoPlayer.jsx # Google Drive video embed
│       │   └── PDFMaterial.jsx # PDF viewer/download
│       └── pages/
│           ├── Landing.jsx     # Landing page (trang chủ)
│           ├── Register.jsx    # Registration info (đăng ký)
│           ├── Platform.jsx    # Nền tảng courses
│           ├── Practice.jsx    # Luyện đề
│           ├── RealPractice.jsx # Thực chiến — mock exams list
│           ├── ExamPage.jsx    # Individual exam runner
│           ├── FreeTrial.jsx   # Học thử miễn phí
│           ├── AdminPanel.jsx  # 🛡️ User management (admin only)
│           ├── SubjectLessons.jsx # Lessons per subject
│           └── LessonView.jsx  # Individual lesson
└── backend/
    ├── Dockerfile
    ├── requirements.txt
    └── app/
        ├── main.py             # FastAPI entry point
        ├── config.py           # Pydantic settings + Google OAuth
        ├── database.py         # Async SQLAlchemy
        ├── auth.py             # JWT + auth dependencies
        ├── models/
        │   ├── user.py         # Google OAuth user
        │   ├── lesson.py       # Lessons + categories
        │   └── progress.py
        ├── routers/
        │   ├── auth.py         # Google login + user management
        │   ├── lessons.py      # CRUD + access control
        │   └── progress.py
        └── schemas/
            ├── user.py
            ├── lesson.py
            └── progress.py
```

---

## ✨ Features

- 🎨 **Dark/Light Mode** — Toggle tự động theo system preference, lưu localStorage
- 🔐 **Google OAuth** — Đăng nhập bằng tài khoản Google, không cần mật khẩu
- 🔒 **Access Control** — Nội dung khóa/mở dựa trên trạng thái đăng ký
- 💳 **SePay Auto Payment** — Tạo QR chuyển khoản, webhook đối soát, tự động cấp quyền học
- �️ **Admin Panel** — Quản lý học viên, cấp/thu hồi quyền truy cập tại `/admin`
- 💬 **Q&A Community** — Hỏi bài bằng text/hình ảnh, câu hỏi public SEO và câu hỏi riêng cho học viên
- 📂 **Kho Tài Liệu Mở** — Catalog PDF Google Drive, người dùng đóng góp tài liệu chờ admin duyệt bản quyền
- 📚 **Multi-page Structure** — Landing, Nền tảng, Luyện đề, Thực chiến, Học thử
- ⚡ **Mock Exam Engine** — Thi thử trực tuyến với timer, chấm điểm, đáp án chi tiết
- 📹 **Google Drive Integration** — Video & PDF embed trực tiếp từ Drive
- 📱 **Responsive** — Tối ưu cho mobile và desktop
- 🛡️ **JWT Authentication** — Secure API với token-based auth

---

## 🚀 Quick Start

### Prerequisites
- **Docker** & **Docker Compose**
- **Google Cloud Console** project (xem [docs/google-auth-setup.md](docs/google-auth-setup.md))

### 1. Configure
```bash
cp .env.example .env
# Thêm GOOGLE_CLIENT_ID và VITE_GOOGLE_CLIENT_ID
```

### 2. Build & run
```bash
docker compose up --build -d
```

### 3. Tạo admin đầu tiên
```bash
# Đăng nhập Google trên website trước, sau đó:
docker compose exec db psql -U dgnl_user -d dgnl_db -c \
  "UPDATE users SET is_admin = true, is_enrolled = true WHERE email = 'your@email.com';"
```

### 4. Quản lý học viên
Sau khi đăng nhập admin → Click avatar → **Quản lý học viên** (hoặc truy cập `/admin`)
- **Cấp quyền**: Cho phép học viên xem toàn bộ video & tài liệu
- **Thu hồi**: Khóa quyền truy cập
- **Cấp Admin**: Thêm quản trị viên mới

### 5. Access
| Service   | URL                          |
|-----------|------------------------------|
| App       | http://localhost:80          |
| API Docs  | http://localhost:80/docs     |

> Production: [https://dgnlmoingay.com](https://dgnlmoingay.com)

---

## 📖 Documentation

| Tài liệu | Mô tả |
|-----------|--------|
| [Deployment Guide](docs/deployment-guide.md) | 🚀 Tổng quan triển khai, quản lý mật khẩu, checklist bảo mật |
| [VPS Setup](docs/vps-setup.md) | 📋 Cài đặt Hetzner VPS từng bước chi tiết |
| [Cloudflare Setup](docs/cloudflare-setup.md) | ☁️ CDN + SSL cho học sinh Việt Nam |
| [Deployment Concepts](docs/deployment-concepts.md) | 📖 Giải thích VPS, DNS, SSL, Docker, Firewall |
| [Google Auth Setup](docs/google-auth-setup.md) | 🔐 Google OAuth, quản lý users, quyền truy cập |
| [Favicon](docs/favicon.md) | 🌐 Cấu hình favicon để hiện icon trên Bing/Google |
| [SePay Payment System](docs/sepay-payment-system.md) | 💳 Kiến trúc thanh toán tự động, webhook bảo mật, vận hành sự cố |
| [User Management](docs/user-management.md) | 👩‍🎓 Thêm học viên bằng email, lịch sử thi thực chiến |
| [Content Management](docs/content-management.md) | 📚 Quản lý video, PDF, bài học |
| [Deep Practice Management](docs/deep-practice-management.md) | 🧩 Quản lý quiz luyện tập chuyên sâu, câu hỏi text/hình ảnh, miễn phí/học viên |
| [Q&A Management](docs/qa-management.md) | 💬 Quản lý hỏi đáp, upload ảnh, quyền public/học viên và backup ảnh VPS |
| [Open Materials Management](docs/open-materials-management.md) | 📂 Quản lý kho tài liệu mở, Google Drive, đóng góp cộng đồng và kiểm duyệt bản quyền |
| [Security Guidelines](docs/security-guidelines.md) | 🛡️ Threat model + OWASP Top-10 mapping, file-upload hardening, secrets, incident response |
| [Architecture Guidelines](docs/architecture-guidelines.md) | 🏗️ Layering, DB/perf playbook, scalability levers, coding conventions, "thêm feature mới" recipe |
| [Development Workflow](docs/development-workflow.md) | 🛠️ Quy trình phát triển local |

---

## 📝 License
Mọi quyền được bảo lưu. Xem [LICENSE](LICENSE).