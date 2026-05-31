# Architecture & Design Guidelines — ĐGNL Mỗi Ngày

Playbook for keeping the codebase scalable, maintainable, and pleasant to work in as features grow. Pair with [security-guidelines.md](security-guidelines.md) for hard security rules.

---

## 1. System architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Cloudflare CDN                           │
│       (DDoS, edge cache for static, TLS termination L1)          │
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTPS (Origin Cert)
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Nginx (reverse proxy)                      │
│   - HSTS, CSP, X-Frame, X-Content-Type                           │
│   - rate-limit: api/auth/webhook/general                         │
│   - /api/*  → FastAPI                                            │
│   - /uploads/* → static volume                                   │
│   - /sitemap.xml /robots.txt → /api/seo/*                        │
│   - /  → React SPA                                               │
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTP (internal docker network)
              ┌────────────────┼─────────────────┐
              ▼                ▼                 ▼
       ┌───────────┐   ┌──────────────┐   ┌──────────────┐
       │ FastAPI   │   │ React SPA    │   │ Postgres 16  │
       │ (async)   │   │ (nginx:80)   │   │              │
       └─────┬─────┘   └──────────────┘   └──────┬───────┘
             │                                   │
             ▼                                   ▼
       [qa_uploads volume]               [postgres_data volume]
```

Service responsibilities:

- **Cloudflare**: edge caching of static assets, bot mitigation, geographic routing.
- **Nginx**: TLS, rate limiting, header injection, path routing.
- **FastAPI**: business logic, auth, persistence orchestration.
- **React SPA**: UI, client-side routing, presentational logic.
- **Postgres**: source of truth for all entities.

---

## 2. Backend layering

```
backend/app/
├── models/      ← SQLAlchemy ORM only.   Knows DB, not HTTP.
├── schemas/     ← Pydantic v2 DTOs only. Knows HTTP, not DB.
├── routers/     ← FastAPI endpoints.     Glue + DI + auth.
├── auth.py      ← Auth dependencies.
├── database.py  ← AsyncSession factory.
├── config.py    ← Pydantic Settings.
└── main.py      ← App factory + middleware + lifespan.
```

### Rules

1. **Models** never import from `schemas/` or `routers/`. They define columns, relationships, and `__tablename__`. Add indexes for any column used in `WHERE`/`ORDER BY` of a list endpoint.
2. **Schemas** never import models, never touch the DB. They validate request bodies and shape response payloads. Use `Field(min_length=…, max_length=…, pattern=…)` aggressively. Use a `field_validator` for cross-field or format checks (see `_validate_http_url` in [open_material.py](../backend/app/schemas/open_material.py)).
3. **Routers** are the only place where models and schemas meet. They:
   - declare `Depends(get_db)` and an auth dependency (`require_auth` / `require_enrolled` / `require_admin`);
   - validate Pydantic payload;
   - call private helpers (`_serialize_*`, `_load_users`, `_normalize_tags`);
   - return Pydantic response models.
4. **Cross-router calls are forbidden.** If two routers need the same logic, extract to a helper in a new module (e.g. `app/services/notifications.py`).

### Anti-patterns to reject in review

- ❌ A function returning a SQLAlchemy model to the caller of a router (always go through a schema).
- ❌ `db.commit()` in a router — `get_db` handles commit/rollback.
- ❌ Importing `_question_summary` from `qa.py` into `notifications.py`. Copy or refactor into a shared helper.
- ❌ Putting `if user.is_admin:` checks inline when `require_admin` would do.

---

## 3. Frontend layering

```
frontend/src/
├── api/client.js       ← Single Axios instance + ALL endpoint helpers
├── contexts/           ← Auth, Theme — cross-cutting state
├── components/         ← Reusable UI (cards, panels, modals)
├── pages/              ← Route-level screens (one component per route)
├── App.jsx             ← Router + RouteSeoMeta
└── main.jsx            ← Providers (GoogleOAuth, Theme, Auth, Router)
```

### Rules

1. **No direct `axios.*` in pages/components.** Add a helper to [client.js](../frontend/src/api/client.js) instead. This keeps the auth interceptor, base URL, and error handling consistent.
2. **Pages** are thin — they fetch data, manage page-level state, and render components. If a page exceeds ~600 lines, extract logical chunks to `components/`.
3. **Components** receive data via props; only `Layout`, `Navbar`, and admin shells consume `AuthContext` directly.
4. **No global state library** today. If we hit ≥5 contexts or repeated prop drilling, consider Zustand (small) before Redux Toolkit.
5. **Styling**: Tailwind utility classes only. No CSS modules, no styled-components. Dark mode via the `dark:` variant — every text/bg color needs a `dark:` counterpart.
6. **Routing-level SEO**: every public route gets metadata in `RouteSeoMeta` (App.jsx) and, when UGC is exposed, a `<JsonLd>` block from [JsonLd.jsx](../frontend/src/components/JsonLd.jsx).

---

## 4. Database & migrations

- **Alembic-first**: every schema change is a migration file in `backend/alembic/versions/`. The backend container CMD runs `alembic upgrade head` before Uvicorn, so a forgotten migration fails the boot.
- **Naming**: `NNN_short_description.py` (3-digit zero-padded, incremental).
- **Always provide downgrade**: drop tables/columns in the reverse order. If a real downgrade is impossible, raise `NotImplementedError` so the impossibility is explicit.
- **Indexes**: add an index in the migration for any FK or column used by a list endpoint's `ORDER BY` / `WHERE`. Pattern:
  ```python
  op.create_index("ix_qa_questions_last_activity_at", "qa_questions", ["last_activity_at"])
  ```
- **Default values**: use `server_default=text("0")` / `text("false")` so backfills happen at the DB level, not in app code.
- **No `Base.metadata.create_all` in runtime code** — it bypasses Alembic and silently diverges schemas.

---

## 5. Performance playbook

| Hotspot | Pattern |
|---|---|
| Listing N items each requiring `User` lookup | `_load_users(db, {ids})` then dict-lookup; one extra query per list page (see `qa.list_questions`) |
| Counters (view, download) | Single `UPDATE … SET count = count + 1` instead of read-modify-write |
| Pagination | `limit = max(1, min(limit, 60))`, `offset` clamped server-side |
| Large list endpoints | Add `created_at DESC` index + cursor pagination if list grows past 10k rows |
| File serving | Always through nginx `alias` from the docker volume, never proxied via FastAPI |
| Sitemap | DB queries capped at 2000 rows per type ([seo.py](../backend/app/routers/seo.py)); nginx caches output 1 hour |

Aim to keep p95 backend response < 200ms for list endpoints. If a query exceeds that, add an index or a materialized count column.

---

## 6. Scalability levers (in order of preference)

1. **Vertical scale the VPS** (cheapest until ~5k MAU).
2. **Increase Uvicorn workers** (`--workers N` already at 4; tune to 2× CPU cores).
3. **Move uploads to object storage** (Cloudflare R2 / S3) when `qa_uploads` exceeds 50 GB or backup time becomes painful. Keep the same `/uploads/<feature>/...` URL shape via a CDN rewrite.
4. **Read replica for Postgres** for heavy public read endpoints (sitemap, materials list).
5. **Frontend code-splitting**: use `React.lazy` for heavy admin pages; current bundle is small enough to skip.
6. **Caching**: prefer Cloudflare edge cache + `Cache-Control` headers on static endpoints over in-app caching. Add Redis only when we have a real cache-thrash problem.

Do not introduce Celery / RabbitMQ / Redis unless a feature genuinely needs durable async jobs. FastAPI `BackgroundTasks` covers our current needs (file cleanup, notification fan-out).

---

## 7. Coding conventions

### Python (backend)
- 4-space indent, 100-char soft line limit.
- `snake_case` for functions / variables; `PascalCase` for classes; `_leading_underscore` for module-private helpers.
- Type hints on every function signature, including return types (`-> list[QAQuestionSummary]`). Use `X | None` (PEP 604) — we're on Python 3.12.
- Public functions get a one-line docstring (and a "Raises" / "Access control:" note if non-trivial).
- Constants in `SCREAMING_SNAKE` at the module top, optionally pulled from env.
- Avoid wildcard imports.

### React (frontend)
- 2-space indent, single quotes.
- PascalCase for components, camelCase for hooks/functions, kebab-case for filenames of constants/utilities (none today).
- Each file exports one default React component plus optional named helpers.
- Hooks at the top of the component, derived state via `useMemo`, side effects via `useEffect` with explicit deps.
- Long JSX (≥300 lines) gets extracted sub-components in the same file (e.g. `SubmissionRow`, `ToggleSwitch` in [AdminMaterialsPanel.jsx](../frontend/src/components/AdminMaterialsPanel.jsx)).

### Git
- Conventional Commits encouraged but not enforced: `feat(qa): add answer pinning`, `fix(payments): clamp amount`.
- Squash merges; PR title becomes commit subject.
- One concern per PR. Refactor + feature in the same PR is discouraged.

---

## 8. Testing strategy (incremental rollout)

We do not yet have an automated test suite. Priorities in order:

1. **Smoke tests** (manual today): can a guest reach the landing page, can a user log in via Google, can a paid user open a locked lesson?
2. **Backend pytest** for the most security-critical paths: `auth.google_login`, `payments.webhook`, `open_materials.review_submission`. Use `httpx.AsyncClient` against an in-memory SQLite or a throwaway Postgres container.
3. **Frontend React Testing Library** for the auth flow + admin gating (`AuthContext` returns expected `isAdmin`).
4. **End-to-end** (Playwright) only for the conversion-critical funnel: Landing → Register → Pay → Verify enrollment unlock.

Until those exist, every PR that touches auth / payments / uploads MUST be reviewed by two contributors and smoke-tested in the staging branch.

---

## 9. Observability roadmap

| Layer | Today | Next |
|---|---|---|
| HTTP logs | nginx default access/error log | Ship to a log aggregator (Loki / Better Stack) |
| App logs | Uvicorn stdout via `docker logs` | Add structured logging (`structlog`) with request-id |
| Errors | Surfaced to user; not collected | Sentry (free tier) |
| Uptime | Cloudflare analytics | Add UptimeRobot ping every 5 min on `/api/health` |
| DB | None | `pg_stat_statements` extension when query count grows |

When adding new error paths, prefer `raise HTTPException(...)` over swallowing — the global response shows the user a friendly error and FastAPI logs the traceback automatically.

---

## 10. Adding a new feature — quick recipe

1. **Design**: write down the user flow + which roles can do what.
2. **Model**: add to `backend/app/models/<feature>.py`, register in [models/__init__.py](../backend/app/models/__init__.py).
3. **Migration**: `docker compose exec backend alembic revision --autogenerate -m "add <feature>"`, edit if needed, commit the file.
4. **Schema**: add `<Feature>Create` / `<Feature>Out` / `<Feature>Update` in `backend/app/schemas/<feature>.py`. Bind `Field()` constraints + a URL/email validator if relevant.
5. **Router**: add `backend/app/routers/<feature>.py`. Choose the right auth dep. Add list endpoint with `limit` clamping.
6. **Wire**: `app.include_router(...)` in [main.py](../backend/app/main.py).
7. **Client**: add helper in [client.js](../frontend/src/api/client.js).
8. **UI**: page in `pages/`, reusable parts in `components/`.
9. **Routing + SEO**: add route in [App.jsx](../frontend/src/App.jsx) + `RouteSeoMeta` entry + `<JsonLd>` if public UGC.
10. **Sitemap**: if list is public, extend [seo.py](../backend/app/routers/seo.py).
11. **Docs**: short section in `docs/<feature>-management.md` (admin SOP).
12. **Smoke test** + open PR.

Follow this every time and the codebase stays predictable.
