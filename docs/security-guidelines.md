# Security Guidelines — ĐGNL Mỗi Ngày

Audit baseline + OWASP Top-10 mapping for the entire stack (FastAPI backend, React frontend, Nginx, Postgres, Docker). Every contributor should skim this before shipping a public-facing change.

> Last audit: May 2026 by the platform team. Re-audit cadence: every quarter or after any change to auth, payments, file upload, or admin endpoints.

---

## 1. Threat model snapshot

| Asset | Sensitivity | Primary threats |
|---|---|---|
| User identity (Google OAuth) | High | Account takeover via stolen JWT, OAuth replay |
| Course content (videos, PDFs) | High commercial value | Scraping, unauthorized access by non-enrolled users |
| Payment orders + bank info | High | Fake "paid" webhooks, payment confusion |
| Q&A user content + uploads | Medium | XSS, malware upload, copyright abuse |
| Open Materials catalog | Medium | URL smuggling, broken-link spam |
| Admin panel | High | Privilege escalation, IDOR |
| Postgres data | High | SQL injection, data exfiltration via misconfigured CORS |

Trust boundaries:

```
[Internet]
   │
   ▼  (HTTPS via Cloudflare)
[Cloudflare edge]
   │
   ▼  (HTTPS via origin cert)
[Nginx reverse proxy] ◀── trust boundary: real_ip from CF only
   │
   ├── /api/*    → FastAPI (HTTP, internal network)
   ├── /uploads/ → static files (read-only)
   └── /        → React SPA

[FastAPI] ── async ──▶ [Postgres] (internal Docker network)
[FastAPI] ── webhook ──▶ [SePay] (outbound only)
```

---

## 2. OWASP Top-10 (2021) — current posture

### A01 Broken Access Control
- ✅ All admin endpoints use `require_admin` from [backend/app/auth.py](../backend/app/auth.py).
- ✅ Lesson router masks Drive IDs through `_apply_access_control` for non-enrolled users.
- ✅ Q&A `_ensure_can_view_question` checks `visibility=public` OR enrollment OR ownership.
- ✅ Materials list defaults to `is_published=True` for non-admins.
- ⚠️ Frontend route guards: `/admin` must check `isAdmin` in `AuthContext`. Always pair an API permission check with a UI guard so non-admins don't see broken UI.
- **Anti-pattern**: never trust `is_admin` from the JWT payload alone; the dependency re-fetches `User` from DB on every request.

### A02 Cryptographic Failures
- ✅ Passwords: not stored. We use Google OAuth ID tokens verified through `google-auth`.
- ✅ JWT: HS256 with `settings.SECRET_KEY` (≥ 32 chars enforced in production by [backend/app/main.py](../backend/app/main.py)).
- ✅ TLS: forced by HSTS header in nginx + Cloudflare; origin uses Cloudflare Origin Cert.
- ✅ Webhook secrets compared with `hmac.compare_digest` to prevent timing attacks ([backend/app/routers/payments.py](../backend/app/routers/payments.py)).
- ⚠️ JWT TTL is 30 days. Trade-off: long sessions for UX, but a stolen token is valid until expiry. Mitigation: short server-side allow-list could be added (`user.token_version`).

### A03 Injection
- ✅ SQL: 100% async SQLAlchemy with parameterized queries. No raw string SQL anywhere.
- ✅ Search: `ilike(f"%{q}%")` is safe under SQLAlchemy parameter binding.
- ✅ Filesystem: filenames replaced with `uuid4().hex + ext`; original names truncated to 255 chars and never used as path; `Path.resolve().relative_to(UPLOAD_DIR)` enforced for any cleanup operation (see `_iter_upload_paths_from_urls` in [qa.py](../backend/app/routers/qa.py) and [open_materials.py](../backend/app/routers/open_materials.py)).
- ✅ Shell: backend never invokes subprocess on user input.
- ⚠️ JSON-LD: the `qaPageSchema` helper inlines `question.title` / `body`. React's `<script type="application/ld+json">` injection in [JsonLd.jsx](../frontend/src/components/JsonLd.jsx) uses `JSON.stringify`, which escapes `</script>` as `\u003c/script>` only in JSON-LD-safe contexts. **Action**: replace any newline-bearing UGC with `\u003c` escapes when published to JSON-LD if we ever loosen XSS protections. Currently safe.

### A04 Insecure Design
- ✅ Three-layer separation (`models` / `schemas` / `routers`).
- ✅ Alembic migrations are the single source of truth for schema; no auto-`create_all` in production.
- ✅ Pre-registered admin accounts can be created without a Google ID, then bound on first login (`auth.google_login`).
- ⚠️ No 2FA option. Acceptable for a learning platform; revisit if we add staff with billing access.

### A05 Security Misconfiguration
- ✅ Debug docs (`/docs`, `/redoc`) disabled when `ENVIRONMENT=production` ([backend/app/main.py](../backend/app/main.py)).
- ✅ Postgres port not published outside Docker network.
- ✅ Nginx blocks dotfiles (`/\.`) and serves only port 80/443.
- ✅ Default-server stanza returns 444 for direct IP access (drops the connection).
- ✅ `Cloudflare real_ip` configured for accurate rate-limiting.
- ✅ Backend container runs as non-root user `dgnl` (UID 1001) — see [backend/Dockerfile](../backend/Dockerfile).
- ⚠️ Base image `python:3.12-slim` should be rebuilt monthly to pick up CVE patches. Consider pinning to a digest in CI for reproducibility.

### A06 Vulnerable & Outdated Components
- ✅ Backend deps pinned in `requirements.txt`.
- ✅ Frontend deps pinned by `package-lock.json`.
- 📋 Run `pip-audit` (backend) and `npm audit --production` (frontend) before each release. Failing checks must be fixed or risk-accepted with an entry in [docs/note.md](note.md).

### A07 Identification & Authentication Failures
- ✅ Brute force: nginx `auth` zone limits `/api/auth/*` to 3 req/s burst 10 per IP.
- ✅ Session fixation: every login mints a new JWT; old tokens remain valid until expiry (acceptable for HS256 stateless).
- ✅ Token leakage: JWT lives only in `localStorage`; never sent in URLs.
- ⚠️ No "logout everywhere" feature. To add: include `token_version` in JWT and bump on logout.

### A08 Software & Data Integrity Failures
- ✅ Frontend assets served from same origin; CSP `default-src 'self'` + specific allow-list.
- ✅ SePay webhook signature verified server-side; orders are idempotent (matched by `order_code` from transfer content).
- ⚠️ No SRI for the small handful of CDN scripts (MathJax, etc.). Add `integrity=` if we keep them.

### A09 Security Logging & Monitoring
- ⚠️ Currently no structured audit log. Recommended: add a `audit_logs` table with `actor_id`, `action`, `target_type`, `target_id`, `metadata_json`, `created_at`, and write rows for: enrollment/unenrollment, admin toggle, material publish/delete, Q&A delete, payment manual-mark-paid.
- ⚠️ No alerting on repeated 401/403 spikes. Cloudflare analytics is the current backstop.
- 📋 At minimum, run `docker compose logs --tail=200 backend` weekly during early operations.

### A10 Server-Side Request Forgery (SSRF)
- ✅ Backend does NOT fetch arbitrary URLs supplied by users (drive_url is only stored, never fetched server-side).
- ✅ VietQR image URL is built from constant bank info + sanitized order content; user input only flows through `quote_plus`.
- 📋 If we ever add link-preview / thumbnail generation, route through a allow-list + private-IP block (RFC 1918 / link-local).

---

## 3. Frontend security checklist

| Concern | Status | Reference |
|---|---|---|
| XSS — user content rendered as text | ✅ React `{value}` auto-escapes | Q&A, materials, deep-practice |
| `dangerouslySetInnerHTML` | ✅ Only `MathContent` (admin-supplied JSON) | [ExamTake.jsx](../frontend/src/components/ExamTake.jsx) |
| `href` injection | ✅ `renderTextWithLinks` regex restricts to `https?://` | [QADetail.jsx](../frontend/src/pages/QADetail.jsx) |
| CSRF | ✅ N/A (Bearer in header, not cookie) | [client.js](../frontend/src/api/client.js) |
| Token storage | ⚠️ `localStorage` — vulnerable to XSS theft. Mitigated by CSP + no rich-text rendering | [client.js](../frontend/src/api/client.js) |
| Open redirect | ✅ All `<Link>` are internal; `target="_blank"` always paired with `rel="noopener noreferrer"` | grep `target="_blank"` |
| Clickjacking | ✅ `X-Frame-Options: SAMEORIGIN` + `frame-ancestors 'self'` | nginx CSP |
| 3rd-party scripts | ⚠️ Google OAuth, MathJax CDN. Add SRI hashes when we have time. | `index.html` |

---

## 4. File-upload hardening recap

Both Q&A and Open Materials follow the same recipe:

1. **Allow-list MIME types** (server-side `content_type` check against `ALLOWED_*_TYPES`).
2. **Per-file byte cap** (`MAX_*_BYTES`, default 5 MB images / 20 MB materials).
3. **Per-request file count cap** (`MAX_*_PER_REQUEST`).
4. **Random filename** (`uuid4().hex + ext`), never user-supplied.
5. **Path traversal safe**: helper `_iter_upload_paths_from_urls` resolves and re-checks `relative_to(UPLOAD_DIR)`.
6. **nginx serves uploads** with `X-Content-Type-Options: nosniff` (global) and 30-day cache.
7. **Cleanup on delete**: `BackgroundTasks.add_task(_cleanup_upload_files, urls)` after the DB delete to prevent orphans.

What we deliberately do NOT do (and why):

- **No virus scan**: scope creep for our threat model; files are admin-reviewed before publish, and PDF/JPG/PNG/WebP execution surface is limited.
- **No EXIF stripping**: low risk because images are user-public on submission already.

---

## 5. Secrets management

- All secrets live in `/<repo>/.env` on the VPS, mounted by `docker-compose.yml` via `env_file: .env`. The file is `chmod 600 root:root`.
- Required env vars: `SECRET_KEY` (≥ 32 chars), `GOOGLE_CLIENT_ID`, `SEPAY_WEBHOOK_SECRET`, `POSTGRES_PASSWORD`, `DATABASE_URL`, `ALLOWED_ORIGINS`, bank fields.
- Rotation: rotate `SECRET_KEY` only when forced (invalidates all sessions). Rotate SePay secret immediately if exposed.
- Generate `SECRET_KEY`:
  ```bash
  python -c 'import secrets; print(secrets.token_urlsafe(64))'
  ```
- **Forbidden**: committing `.env`, sending env values via chat, logging full env on startup.

---

## 6. Network & infra

- Only ports 80/443 open on the VPS firewall (`ufw allow 80,443`). SSH on a non-default port + key-only auth.
- Cloudflare proxy enabled (orange cloud) for all hostnames; DDoS rules at the edge.
- Backups: nightly Postgres `pg_dump` to off-host storage (configure via cron — see [docs/vps-setup.md](vps-setup.md)).
- Docker volumes (`postgres_data`, `qa_uploads`) backed up weekly.

---

## 7. Incident response quick card

| Scenario | First action |
|---|---|
| Suspected SECRET_KEY leak | Rotate `SECRET_KEY` + `docker compose restart backend` (logs everyone out) |
| Suspected SePay secret leak | Rotate in SePay dashboard, update `.env`, restart backend, audit recent `paid` orders for the last 24h |
| Mass spam Q&A / materials | Bump `auth` rate limit to `1r/s` in nginx + `reload`; consider temporary `require_enrolled` on `create_question_json` |
| XSS report | Disable `dangerouslySetInnerHTML` usage immediately, ship patched build, audit affected fields |
| Lost admin account | `docker compose exec db psql ... -c "UPDATE users SET is_admin=true WHERE email='you@x.com';"` |

---

## 8. Pre-deploy checklist

- [ ] `.env` updated with strong `SECRET_KEY` and webhook secret.
- [ ] `ENVIRONMENT=production` in `.env` (disables `/docs`, enforces SECRET_KEY check).
- [ ] `ALLOWED_ORIGINS` lists only production hostnames.
- [ ] `docker compose build --no-cache && docker compose up -d` succeeds.
- [ ] `curl -I https://dgnlmoingay.com` returns `Strict-Transport-Security` + CSP headers.
- [ ] `curl https://dgnlmoingay.com/api/health` returns `{"status":"healthy"}`.
- [ ] Smoke test: Google login → access protected lesson → contribute material → trigger payment QR.
- [ ] `pip-audit` + `npm audit --production` reviewed.
