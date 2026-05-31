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

## Security Requirements (OWASP-aligned, mandatory)

These rules are enforced for every PR. If a change conflicts with them, push back or escalate before merging. See [docs/security-guidelines.md](../docs/security-guidelines.md) for the full OWASP Top-10 mapping and threat model.

### Authentication & authorization
- All write endpoints MUST use `require_auth`, `require_enrolled`, or `require_admin` from `backend/app/auth.py`. Never gate on `user.is_admin` inline if a dependency exists.
- Public read endpoints that expose user content (Q&A, materials) MUST re-check `visibility`/`is_published` on every record and respect `_apply_access_control` patterns for lessons.
- Google login MUST go through `id_token.verify_oauth2_token` with the configured `GOOGLE_CLIENT_ID`. Never trust client-decoded JWTs.
- JWTs are stored in `localStorage` as `dgnl-token`; do NOT move auth state to cookies without adding CSRF protection (`SameSite=Strict` + double-submit token).
- New admin-only flows MUST also be hidden in the UI (route guard + nav guard), not just on the API.

### Input validation & output encoding
- Every request body is a Pydantic v2 schema with explicit `Field(min_length=…, max_length=…)` and patterns; never accept raw `dict`/`Any`.
- URL fields use the `_validate_http_url` pattern in [backend/app/schemas/open_material.py](../backend/app/schemas/open_material.py) — reject anything that isn't `http(s)://` + host.
- Filenames are length-clamped (`[:255]`) and never used directly on disk — always generate `uuid4().hex + ext` and resolve against the upload root with `.resolve().relative_to(root)` to prevent path traversal.
- Tags/strings get `.strip().lower()[:N]` normalization plus dedupe (see `_normalize_tags`).
- React renders all user content through `{value}` text nodes. `dangerouslySetInnerHTML` is ONLY allowed for admin-controlled static JSON (MathJax exam content). If you must render rich user text, route it through DOMPurify first.

### Secrets, config & TLS
- `SECRET_KEY` must be ≥ 32 chars and not in `_INSECURE_SECRETS`; the app fails to boot in production otherwise (see [backend/app/main.py](../backend/app/main.py)).
- All secrets come from `.env` → `docker-compose.yml` env. Never hardcode in source, commit `.env`, or log secret values.
- Webhook secrets MUST be compared with `hmac.compare_digest`; never `==`.
- HTTPS-only in production: HSTS + CSP are set in [nginx/nginx.conf](../nginx/nginx.conf). Don't weaken CSP without justification; prefer adding the new origin to the allow-list.
- CORS uses an explicit origin list and an explicit method/header allow-list. `allow_origins=["*"]` with credentials is forbidden.

### File uploads & storage
- Validate `content_type` against an allow-list mapping (e.g. `ALLOWED_IMAGE_TYPES`) and enforce a per-file byte limit (`MAX_IMAGE_BYTES` / `MAX_FILE_BYTES`) BEFORE writing to disk.
- Store under `/app/uploads/<feature>/YYYY/MM/<uuid>.<ext>` and return URLs prefixed with `/uploads/<feature>/...` so nginx can serve them as static with `X-Content-Type-Options: nosniff`.
- When a record is deleted, schedule `BackgroundTasks.add_task(_cleanup_upload_files, urls)` (see [open_materials.delete_submission](../backend/app/routers/open_materials.py)) to avoid orphans.

### Rate limiting & abuse
- Sensitive endpoints (`/api/auth/*`, `/api/payments/*`, admin endpoints) ride the stricter `auth` / `webhook` zones in nginx — keep them under `location ~ ^/api/(auth|payments)`. Don't bypass.
- Add nginx `limit_req` for any new public mutation endpoint.
- Database queries that accept user pagination MUST clamp `limit` (e.g. `max(1, min(limit, 60))`) to prevent resource exhaustion.

### Logging & auditing
- Never log credentials, tokens, full request bodies of `/api/auth/*` or `/api/payments/*`, or PII beyond `user_id`/`email` hash.
- Admin-mutating endpoints (enroll, delete, publish) should log `actor_id` + `target_id` + action. When adding new ones, follow the same pattern.

## Design & Scalability Principles

Long-term health of the codebase. See [docs/architecture-guidelines.md](../docs/architecture-guidelines.md) for the full playbook.

### Layering
- Strict three-layer separation per feature: `models/` (SQLAlchemy ORM) → `schemas/` (Pydantic DTOs) → `routers/` (HTTP + DI). Routers MUST NOT import other routers; share logic via small helpers in the router file or a sibling `services/` module.
- Models never reference `request`/`response` types. Schemas never call the DB.
- Cross-feature reads go through a service helper, not by importing another router's private function (`_question_summary` etc. are private — copy/refactor instead).

### Database & performance
- Async SQLAlchemy only. Never call sync `Session` inside an async handler.
- Always `await db.flush()` + `await db.refresh(entity)` before serializing newly-created rows; rely on `get_db()` to commit on success and rollback on error.
- Avoid N+1: when serializing a list, batch-load related users/lessons with `select(User).where(User.id.in_(ids))` (see `_load_users`).
- Every new table gets an Alembic migration in `backend/alembic/versions/`. Never `Base.metadata.create_all` in production code paths.
- Index columns used in `WHERE`/`ORDER BY` for any list endpoint (`created_at`, `status`, FKs).

### Frontend organization
- All server calls go through helpers in [frontend/src/api/client.js](../frontend/src/api/client.js); pages/components don't import `axios` directly.
- Reusable UI in `frontend/src/components/`; route-level screens in `frontend/src/pages/`; cross-cutting state via `contexts/`.
- Don't store secrets, tokens, or PII anywhere outside `localStorage['dgnl-token']` and `AuthContext` state.
- Tailwind utility classes only; no inline `style={{...}}` for static styling.

### SEO & content
- Public routes need a metadata entry in `RouteSeoMeta` (App.jsx) AND, when they expose UGC, a `<JsonLd>` schema block (see [frontend/src/components/JsonLd.jsx](../frontend/src/components/JsonLd.jsx)).
- New publicly-listable entities (quizzes, exams, materials, Q&A) must surface in [backend/app/routers/seo.py](../backend/app/routers/seo.py)'s sitemap loop.

### Maintainability
- Public functions get a short docstring describing intent and any access-control assumption.
- Magic numbers (limits, byte sizes, retention) go into module-level constants or env vars with a sane default, never inline.
- Prefer `BackgroundTasks` (FastAPI) for fire-and-forget work (file cleanup, notifications); reach for a queue only if a task needs durability or retries.
- Before adding a third copy of similar logic, extract a helper. Two is a coincidence, three is a pattern.