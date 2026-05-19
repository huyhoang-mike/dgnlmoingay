# Copilot Instructions for ĐGNL Mỗi Ngày

## Big Picture
- This is a Dockerized course platform: React + Vite + Tailwind frontend, FastAPI backend, PostgreSQL, and Nginx reverse proxy. Production targets `https://dgnlmoingay.com` behind Cloudflare.
- Service boundaries are explicit in `docker-compose.yml`: `nginx` routes `/api/*` and `/uploads/*` to FastAPI, everything else to the frontend SPA; `backend` uses Postgres and stores Q&A uploads in the `qa_uploads` volume.
- Backend entrypoint is `backend/app/main.py`: routers are mounted under `/api/{auth,lessons,progress,exams,payments,qa,open-materials}` and uploads are served from `/uploads`.
- Frontend routing lives in `frontend/src/App.jsx`; most server communication must go through the exported helpers in `frontend/src/api/client.js` rather than ad hoc Axios calls.
- Exam and deep-practice content is partly static JSON under `frontend/public/exams` and `frontend/public/deep-practice`; attempts/settings are persisted through `/api/exams` endpoints.

## Backend Patterns
- Use async SQLAlchemy everywhere: inject `AsyncSession` with `Depends(get_db)` from `backend/app/database.py`; it commits on successful request and rolls back on exceptions.
- Add new database entities in three layers: `backend/app/models`, `backend/app/schemas`, and `backend/app/routers`; register models in `backend/app/models/__init__.py` and routers in `backend/app/main.py`.
- Migrations are Alembic-first. The backend Docker CMD runs `alembic upgrade head` before Uvicorn; create schema changes with `docker compose exec backend alembic revision --autogenerate -m "..."`.
- Auth dependencies are centralized in `backend/app/auth.py`: use `get_current_user` for optional auth, `require_auth` for login, `require_enrolled` for course-only access, and `require_admin` for admin APIs.
- Preserve access-control masking patterns such as `lessons._apply_access_control`, which hides Drive IDs/content unless a lesson is free or the user is enrolled/admin.
- Keep SePay/payment behavior in `backend/app/routers/payments.py`: order codes are generated server-side, webhook secrets are compared with `hmac.compare_digest`, and paid orders grant enrollment.
- Q&A image uploads are VPS-backed files, not object storage: validate content type/size in `backend/app/routers/qa.py` and return URLs under `/uploads/qa/...`.

## Frontend Patterns
- `frontend/src/main.jsx` wraps the app in `GoogleOAuthProvider`, `BrowserRouter`, `ThemeProvider`, and `AuthProvider`; components should consume auth via `useAuth()` from `contexts/AuthContext.jsx`.
- JWTs are stored as `localStorage['dgnl-token']`; `frontend/src/api/client.js` attaches them via an Axios request interceptor and clears them on `401`.
- Use Tailwind utility classes and existing component/page organization: reusable UI in `frontend/src/components`, route-level screens in `frontend/src/pages`.
- For multipart APIs, follow existing helpers such as `createQAQuestion`, `createQAAnswer`, `importLessons`, and `submitOpenMaterial` that set `Content-Type: multipart/form-data`.
- SEO metadata is managed inside `RouteSeoMeta` in `frontend/src/App.jsx`; add route metadata there when adding public pages.

## Workflows
- Full stack local/prod-like run: `docker compose up --build -d`; app is at `http://localhost`, API docs at `http://localhost/docs` when `ENVIRONMENT` is not `production`.
- Recommended fast frontend loop: `docker compose up -d db backend`, then `cd frontend && npm run dev`; Vite proxies `/api` to `http://localhost:8000` via `frontend/vite.config.js`.
- Backend local loop: create a venv in `backend`, install `requirements.txt`, set `DATABASE_URL` to localhost Postgres, then run `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`.
- Validation commands currently documented: `cd frontend && npm run build` for production build and `npm run lint` for ESLint. Backend has no committed test suite; use targeted API checks like `curl http://localhost/api/health`.
- Admin bootstrap after first Google login is a DB update, e.g. `docker compose exec db psql -U dgnl_user -d dgnl_db -c "UPDATE users SET is_admin = true, is_enrolled = true WHERE email = 'you@example.com';"`.

## Project-Specific Gotchas
- Do not commit `.env` or secrets. Required env values are wired through `docker-compose.yml`, including Google OAuth, JWT, SePay, bank account, and course/support URLs.
- In production, FastAPI docs are disabled when `ENVIRONMENT=production`; Nginx still proxies `/docs`, but the backend may not expose it.
- `DATABASE_URL` uses host `db` inside Docker and `localhost` when running backend outside Docker.
- Frontend production images bake `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` at build time, so changing these requires rebuilding the frontend image.