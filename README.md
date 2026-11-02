# ĐGNL Mỗi Ngày — Course Management Web App

**Languages:** English | [Tiếng Việt](README.vi.md)

> A course management platform for "ĐGNL Mỗi Ngày", built with **React + Vite + Tailwind CSS** (frontend), **FastAPI** (backend), **PostgreSQL** (database), and **Nginx** (reverse proxy). It supports **dark and light themes**, **Google OAuth**, and **content access control**. Deployed on a **Hetzner VPS** with **Docker Compose** and **Cloudflare CDN**.
>
> 🌐 **Production:** [https://dgnlmoingay.com](https://dgnlmoingay.com)

---

## 📁 Project Structure

```
dgnlmoingay/
├── docker-compose.yml
├── .env                        # Environment variables (not committed)
├── nginx/
│   └── nginx.conf              # Reverse proxy
├── docs/
│   ├── info.md                 # Course content information
│   ├── content-management.md   # Content management guide
│   ├── development-workflow.md # Development workflow
│   ├── google-auth-setup.md   # 🔐 Google OAuth and access control guide
│   └── sepay-payment-system.md # 💳 SePay automatic payment architecture and operations
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js      # Dark mode enabled
│   └── src/
│       ├── main.jsx            # Google OAuth, theme, and auth providers
│       ├── App.jsx             # Multi-page routing
│       ├── index.css           # Dark mode styles
│       ├── api/client.js       # Axios and JWT interceptors
│       ├── contexts/
│       │   ├── ThemeContext.jsx # Dark/light theme
│       │   └── AuthContext.jsx # Google authentication state
│       ├── components/
│       │   ├── Layout.jsx      # Navbar and footer layout
│       │   ├── Navbar.jsx      # Navigation, theme, and authentication
│       │   ├── Footer.jsx
│       │   ├── Sidebar.jsx     # Lesson sidebar
│       │   ├── ExamTake.jsx    # Mock exam engine
│       │   ├── VideoPlayer.jsx # Google Drive video embed
│       │   └── PDFMaterial.jsx # PDF viewer and download
│       └── pages/
│           ├── Landing.jsx     # Landing page
│           ├── Register.jsx    # Registration information
│           ├── Platform.jsx    # Course platform
│           ├── Practice.jsx    # Practice exams
│           ├── RealPractice.jsx # Real exam simulation list
│           ├── ExamPage.jsx    # Individual exam runner
│           ├── FreeTrial.jsx   # Free trial
│           ├── AdminPanel.jsx  # 🛡️ User management (admin only)
│           ├── SubjectLessons.jsx # Lessons by subject
│           └── LessonView.jsx  # Individual lesson
└── backend/
    ├── Dockerfile
    ├── requirements.txt
    └── app/
        ├── main.py             # FastAPI entry point
        ├── config.py           # Pydantic settings and Google OAuth
        ├── database.py         # Async SQLAlchemy
        ├── auth.py             # JWT and authentication dependencies
        ├── models/
        │   ├── user.py         # Google OAuth user
        │   ├── lesson.py       # Lessons and categories
        │   └── progress.py
        ├── routers/
        │   ├── auth.py         # Google login and user management
        │   ├── lessons.py      # CRUD and access control
        │   └── progress.py
        └── schemas/
            ├── user.py
            ├── lesson.py
            └── progress.py
```

---

## ✨ Features

- 🎨 **Dark and light themes** — Follows the system preference automatically and saves the selection in local storage
- 🔐 **Google OAuth** — Sign in with a Google account; no password required
- 🔒 **Access control** — Content access depends on enrollment status
- 💳 **SePay automatic payments** — Generates bank transfer QR codes, reconciles payments through webhooks, and grants course access automatically
- 🛡️ **Admin panel** — Manage students and grant or revoke access at `/admin`
- 💬 **Q&A community** — Ask questions with text or images; supports public, SEO-indexed questions and private student questions
- 📂 **Open materials library** — Google Drive PDF catalog with community submissions and admin copyright review
- 📚 **Multi-page experience** — Landing page, courses, practice exams, exam simulations, and free trials
- ⚡ **Mock exam engine** — Timed online exams with automatic scoring and detailed answers
- 📹 **Google Drive integration** — Embed videos and PDFs directly from Drive
- 📱 **Responsive design** — Optimized for mobile and desktop
- 🛡️ **JWT authentication** — Token-based API security

---

## 🚀 Quick Start

### Prerequisites
- **Docker** and **Docker Compose**
- A **Google Cloud Console** project (see [docs/google-auth-setup.md](docs/google-auth-setup.md))

### 1. Configure
```bash
cp .env.example .env
# Set GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID
```

### 2. Build and run
```bash
docker compose up --build -d
```

### 3. Create the first admin
```bash
# Sign in to the website with Google first, then run:
docker compose exec db psql -U dgnl_user -d dgnl_db -c \
  "UPDATE users SET is_admin = true, is_enrolled = true WHERE email = 'your@email.com';"
```

### 4. Manage students
After signing in as an admin, click the avatar and select **Manage Students** (or visit `/admin`).
- **Grant access**: Allow a student to view all videos and materials
- **Revoke access**: Restrict course access
- **Grant admin role**: Add another administrator

### 5. Access the services
| Service  | URL                     |
|----------|-------------------------|
| App      | http://localhost:80     |
| API docs | http://localhost:80/docs |

> Production: [https://dgnlmoingay.com](https://dgnlmoingay.com)

---

## 📖 Documentation

| Guide | Description |
|-------|-------------|
| [Deployment Guide](docs/deployment-guide.md) | 🚀 Deployment overview, password management, and security checklist |
| [VPS Setup](docs/vps-setup.md) | 📋 Step-by-step Hetzner VPS setup |
| [Cloudflare Setup](docs/cloudflare-setup.md) | ☁️ CDN and SSL configuration for learners in Vietnam |
| [Deployment Concepts](docs/deployment-concepts.md) | 📖 VPS, DNS, SSL, Docker, and firewall concepts |
| [Google Auth Setup](docs/google-auth-setup.md) | 🔐 Google OAuth, user management, and access control |
| [Favicon](docs/favicon.md) | 🌐 Configure the favicon for Bing and Google search results |
| [SePay Payment System](docs/sepay-payment-system.md) | 💳 Automatic payment architecture, webhook security, and incident operations |
| [User Management](docs/user-management.md) | 👩‍🎓 Add students by email and review real exam history |
| [Content Management](docs/content-management.md) | 📚 Manage videos, PDFs, and lessons |
| [Deep Practice Management](docs/deep-practice-management.md) | 🧩 Manage in-depth practice quizzes, text/image questions, and free or enrolled access |
| [Q&A Management](docs/qa-management.md) | 💬 Manage questions and answers, image uploads, visibility, and VPS image backups |
| [Open Materials Management](docs/open-materials-management.md) | 📂 Manage the open materials library, Google Drive, community submissions, and copyright review |
| [Security Guidelines](docs/security-guidelines.md) | 🛡️ Threat model, OWASP Top 10, secure file uploads, secrets, and incident response |
| [Architecture Guidelines](docs/architecture-guidelines.md) | 🏗️ Layering, database performance, scalability, conventions, and a feature-development guide |
| [Development Workflow](docs/development-workflow.md) | 🛠️ Local development workflow |

---

## 📝 License
All rights reserved. See [LICENSE](LICENSE).
