# 📖 Các khái niệm quan trọng cho Deployment — ĐGNL Mỗi Ngày

> Giải thích các khái niệm kỹ thuật cần biết để triển khai và vận hành ứng dụng web.
> Dành cho người mới bắt đầu với VPS và deployment.

---

## Mục lục

1. [VPS — Máy chủ ảo](#1-vps--máy-chủ-ảo)
2. [Domain Name — Tên miền](#2-domain-name--tên-miền)
3. [DNS — Hệ thống phân giải tên miền](#3-dns--hệ-thống-phân-giải-tên-miền)
4. [SSH — Kết nối an toàn tới VPS](#4-ssh--kết-nối-an-toàn-tới-vps)
5. [SSL/TLS — Chứng chỉ bảo mật (HTTPS)](#5-ssltls--chứng-chỉ-bảo-mật-https)
6. [Firewall — Tường lửa](#6-firewall--tường-lửa)
7. [Docker — Đóng gói ứng dụng](#7-docker--đóng-gói-ứng-dụng)
8. [Nginx — Reverse Proxy](#8-nginx--reverse-proxy)
9. [CDN — Mạng phân phối nội dung](#9-cdn--mạng-phân-phối-nội-dung)
10. [Cloudflare — CDN + SSL + Bảo mật](#10-cloudflare--cdn--ssl--bảo-mật)

---

## 1. VPS — Máy chủ ảo

### VPS là gì?

**VPS (Virtual Private Server)** là một máy tính ảo chạy Linux trên cloud. Bạn có toàn quyền root (quyền admin tối cao), giống như thuê 1 cái máy tính chạy 24/7, truy cập qua internet.

### So sánh với hosting thường

| | Shared Hosting | VPS | Dedicated Server |
|---|---|---|---|
| **Giá** | Rẻ nhất (~50k/tháng) | Vừa phải (~100-500k/tháng) | Đắt (~2tr+/tháng) |
| **Quyền** | Hạn chế | Root access | Root access |
| **Hiệu suất** | Chia sẻ với người khác | Riêng, ổn định | Máy riêng hoàn toàn |
| **Phù hợp** | Website HTML đơn giản | Docker, app tùy chỉnh | Enterprise |

### VPS trong dự án này

```
┌─────────────────────────────────────────────────┐
│  Hetzner VPS (Ubuntu 24.04)                     │
│  CX22: 2 vCPU, 4GB RAM, 40GB SSD               │
│                                                  │
│  ┌─── Docker ──────────────────────────────┐    │
│  │  ┌────────┐  ┌─────────┐  ┌──────────┐ │    │
│  │  │  Nginx │  │ Backend │  │ Frontend │ │    │
│  │  │  :80   │  │  :8000  │  │   :80    │ │    │
│  │  └────────┘  └─────────┘  └──────────┘ │    │
│  │  ┌────────────┐                         │    │
│  │  │ PostgreSQL │                         │    │
│  │  │   :5432    │                         │    │
│  │  └────────────┘                         │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  Firewall: chỉ mở port 22, 80, 443             │
│  IP: 65.109.xxx.xxx                             │
└─────────────────────────────────────────────────┘
```

---

## 2. Domain Name — Tên miền

### Tên miền là gì?

Tên thân thiện thay cho địa chỉ IP: `dgnlmoingay.com` thay vì `65.109.xxx.xxx`.

### Cấu trúc tên miền

```
dgnlmoingay.com
│           │   │
│           │   └── ccTLD: .vn (Việt Nam)
│           └── SLD: .edu (giáo dục)
└── Tên: dgnlmoingay
```

### Phân loại domain

| Loại | Ví dụ | Ghi chú |
|------|-------|---------|
| `.com` | dgnlmoingay.com | Phổ biến nhất, quốc tế |
| `.vn` | example.vn | Việt Nam, cần CCCD |
| `.edu.vn` | example.edu.vn | Giáo dục VN, cần doanh nghiệp |
| `.io` | example.io | Phổ biến cho tech |

> Domain `.com` phổ biến nhất, đăng ký dễ dàng, phù hợp cho mọi loại dự án.

---

## 3. DNS — Hệ thống phân giải tên miền

### DNS là gì?

**DNS (Domain Name System)** — "Danh bạ điện thoại" của internet. Khi bạn gõ `dgnlmoingay.com`, DNS dịch thành IP `65.109.xxx.xxx` để browser biết kết nối tới đâu.

### Cách hoạt động (đơn giản)

```
Browser gõ: dgnlmoingay.com
        │
        ▼
DNS Server: "dgnlmoingay.com = 65.109.xxx.xxx"
        │
        ▼
Browser kết nối tới 65.109.xxx.xxx
        │
        ▼
VPS trả về trang web
```

### Các loại DNS Record cần biết

| Loại | Mục đích | Ví dụ trong dự án |
|------|----------|-------------------|
| **A Record** | Trỏ domain → IPv4 | `dgnlmoingay.com → 65.109.xxx.xxx` |
| **AAAA Record** | Trỏ domain → IPv6 | `dgnlmoingay.com → 2a01:4f8::1` |
| **CNAME** | Alias (bí danh) | `www.dgnlmoingay.com → dgnlmoingay.com` |
| **MX** | Mail server | Nếu cần email @dgnlmoingay.com |
| **TXT** | Xác minh ownership | Google Search Console verification |
| **NS** | Nameserver | Trỏ về Cloudflare khi dùng CDN |

### DNS Propagation

Sau khi thay đổi DNS record, cần đợi **5 phút — 48 giờ** để thay đổi lan truyền khắp thế giới. Thường mất **15-30 phút**.

Kiểm tra DNS đã cập nhật chưa:
```bash
# Trên terminal
nslookup dgnlmoingay.com
# Hoặc
dig dgnlmoingay.com
```

---

## 4. SSH — Kết nối an toàn tới VPS

### SSH là gì?

**SSH (Secure Shell)** — Giao thức kết nối từ xa vào VPS qua terminal, **mã hóa toàn bộ** dữ liệu truyền tải.

### Cách SSH hoạt động

```
Máy bạn (Windows)                    VPS (Linux)
┌──────────────┐                     ┌──────────────┐
│ Private Key  │ ──── mã hóa ────► │ Public Key   │
│ (giữ bí mật) │                     │ (ai cũng OK) │
│              │ ◄──── xác minh ─── │              │
│ ssh root@... │                     │ Cho phép vào │
└──────────────┘                     └──────────────┘
```

### 2 cách đăng nhập SSH

| Cách | Bảo mật | Ghi chú |
|------|---------|---------|
| **Password** | ⚠️ Yếu — dễ bị brute-force | Mặc định, nên tắt sau khi setup SSH key |
| **SSH Key** | ✅ Rất mạnh — gần như không hack được | Khuyến nghị dùng |

### SSH Key là gì?

Cặp khóa mã hóa gồm:
- **Private Key** (khóa riêng): Giữ trên máy bạn, **KHÔNG BAO GIỜ chia sẻ**
- **Public Key** (khóa công khai): Đặt trên VPS, ai có cũng OK

Chỉ máy nào có private key tương ứng mới SSH vào được.

---

## 5. SSL/TLS — Chứng chỉ bảo mật (HTTPS)

### SSL/HTTPS là gì?

**SSL/TLS** mã hóa traffic giữa browser và server → không ai đọc trộm được. Browser hiện 🔒 thay vì ⚠️ "Not Secure".

### Tại sao bắt buộc?

| Lý do | Chi tiết |
|-------|----------|
| **Google OAuth** | Google **yêu cầu** HTTPS cho production |
| **Bảo mật JWT** | Token truyền qua HTTP có thể bị đánh cắp |
| **SEO** | Google ưu tiên website HTTPS |
| **Uy tín** | Browser cảnh báo "Not Secure" nếu không có |
| **Pháp lý** | Bảo vệ dữ liệu cá nhân học sinh |

### HTTP vs HTTPS

```
HTTP (port 80):    Browser ←── text thuần ──► Server
                   👀 Ai cũng đọc được

HTTPS (port 443):  Browser ←── mã hóa ──► Server
                   🔒 Chỉ 2 bên hiểu được
```

### Trong dự án: Cloudflare xử lý SSL

```
Browser (HTTPS) → Cloudflare (SSL cert) → VPS (HTTP nội bộ)
       🔒                                      💬 OK vì nội bộ
```

Cloudflare cung cấp SSL certificate **miễn phí và tự động** — không cần tự quản lý certificate.

---

## 6. Firewall — Tường lửa

### Firewall là gì?

Bộ lọc quyết định traffic nào được phép vào/ra VPS. Giống bảo vệ cổng tòa nhà — chỉ cho người có thẻ vào.

### Trong dự án: UFW

**UFW (Uncomplicated Firewall)** — firewall đơn giản trên Ubuntu.

```
Internet
    │
    ├── Port 22 (SSH)   → ✅ Cho phép (quản trị)
    ├── Port 80 (HTTP)  → ✅ Cho phép (website)
    ├── Port 443 (HTTPS)→ ✅ Cho phép (website)
    ├── Port 5432 (DB)  → ❌ Chặn (chỉ nội bộ Docker)
    ├── Port 8000 (API) → ❌ Chặn (chỉ nội bộ Docker)
    └── Các port khác   → ❌ Chặn tất cả
```

### Tại sao chặn port DB?

Nếu mở port 5432 ra internet, **BẤT KỲ AI** biết password có thể truy cập trực tiếp database → đọc/xóa/sửa toàn bộ dữ liệu. Trong Docker, các container nói chuyện qua **mạng nội bộ** (Docker network) mà không cần mở port ra ngoài.

---

## 7. Docker — Đóng gói ứng dụng

### Docker là gì?

**Docker** đóng gói ứng dụng + tất cả dependencies vào **container** — một "hộp" độc lập chạy giống nhau trên mọi máy.

### Tại sao dùng Docker?

| Không Docker | Có Docker |
|---|---|
| Cài Python, Node, PostgreSQL trên VPS | Chỉ cần Docker, chạy 1 lệnh |
| "Máy tôi chạy được mà" 😤 | Chạy giống nhau mọi nơi ✅ |
| Xung đột phiên bản | Mỗi container isolated |
| Gỡ cài đặt phức tạp | `docker compose down` xong |

### Các khái niệm Docker

| Khái niệm | Giải thích đơn giản | Ví dụ trong dự án |
|------------|---------------------|-------------------|
| **Image** | "Bản thiết kế" của container | `python:3.12-slim`, `nginx:alpine` |
| **Container** | Instance chạy từ image | `dgnl_backend`, `dgnl_nginx` |
| **Dockerfile** | File hướng dẫn build image | `backend/Dockerfile` |
| **Volume** | Lưu trữ data bền vững | `postgres_data` — data DB không mất khi restart |
| **Network** | Mạng nội bộ giữa containers | `dgnl_network` |
| **Docker Compose** | Quản lý nhiều containers cùng lúc | `docker-compose.yml` |

### Docker Compose trong dự án

```yaml
# docker-compose.yml định nghĩa 4 services:
services:
  db:         # PostgreSQL — lưu data
  backend:    # FastAPI — xử lý logic, API
  frontend:   # React — giao diện người dùng
  nginx:      # Nginx — cổng vào, routing
```

```bash
# 1 lệnh = khởi động toàn bộ hệ thống
docker compose up -d

# 1 lệnh = dừng tất cả
docker compose down
```

---

## 8. Nginx — Reverse Proxy

### Reverse Proxy là gì?

**Reverse Proxy** đứng giữa internet và các server nội bộ, chuyển tiếp request tới đúng service.

### Trong dự án: 2 Nginx

```
┌─── Nginx #1 (Reverse Proxy) ─── port 80 ───┐
│                                               │
│  URL /api/*    → Backend container (:8000)   │
│  URL /*        → Frontend container (:80)    │
│                                               │
│  + Security headers                          │
│  + Rate limiting                             │
│  + Cloudflare real IP                        │
└───────────────────────────────────────────────┘

┌─── Nginx #2 (bên trong Frontend container) ──┐
│                                               │
│  Serve file static (JS, CSS, HTML)           │
│  SPA fallback: mọi route → index.html        │
│  Cache static assets 1 năm                   │
└───────────────────────────────────────────────┘
```

### Tại sao cần Reverse Proxy?

| Không có | Có Reverse Proxy |
|----------|-----------------|
| User phải biết port: `:8000` cho API, `:3000` cho web | 1 URL duy nhất cho tất cả |
| Mỗi service tự xử lý SSL | Nginx xử lý SSL 1 chỗ |
| Không có rate limiting | Nginx chặn spam/DDoS |
| IP thật bị ẩn sau proxy | `X-Real-IP` header truyền IP |

---

## 9. CDN — Mạng phân phối nội dung

### CDN là gì?

**CDN (Content Delivery Network)** — Mạng lưới server đặt **khắp thế giới** để phục vụ nội dung từ server **gần nhất** với người dùng.

### Tại sao cần CDN?

```
Không có CDN:
  Học sinh (HCM) ──── 12,000 km ────► Hetzner (Đức)
  Latency: ~200ms mỗi request

Có CDN (Cloudflare):
  Học sinh (HCM) ──── 10 km ────► Cloudflare PoP (HCM)
  Latency: ~30ms (cache hit)
                   │
                   ├── Cache hit? → Trả về ngay ⚡
                   └── Cache miss? → Lấy từ Hetzner, cache lại
```

### CDN cache những gì?

| Loại | Cache? | Ví dụ |
|------|--------|-------|
| HTML pages | ✅ Có (ngắn hạn) | Landing page |
| JS/CSS/Images | ✅ Có (dài hạn) | React bundle, logo |
| API responses | ❌ Không cache | `/api/lessons/`, `/api/auth/google` |
| Video/PDF | Dùng Google Drive | Không qua CDN |

---

## 10. Cloudflare — CDN + SSL + Bảo mật

### Cloudflare là gì?

**Cloudflare** là dịch vụ **miễn phí** cung cấp:
- 🌐 **CDN** — Cache static content ở 300+ PoP trên thế giới (có ở VN)
- 🔒 **SSL/HTTPS** — Certificate tự động, miễn phí
- 🛡️ **DDoS Protection** — Chặn tấn công tự động
- 📊 **Analytics** — Xem traffic, bandwidth
- ⚡ **Performance** — Minify, compression, HTTP/3

### Cách Cloudflare hoạt động

```
Trước khi dùng Cloudflare:
  DNS: dgnlmoingay.com → 65.109.xxx.xxx (IP thật của VPS)
  Browser → VPS trực tiếp

Sau khi dùng Cloudflare:
  DNS: dgnlmoingay.com → 104.21.xxx.xxx (IP của Cloudflare)
  Browser → Cloudflare → VPS
  Cloudflare đứng giữa, xử lý cache/SSL/bảo mật
```

### Tại sao IP VPS bị "ẩn"?

Khi dùng Cloudflare (proxy mode), DNS trả về **IP của Cloudflare** thay vì IP VPS thật. Điều này:
- ✅ Bảo vệ VPS khỏi tấn công trực tiếp
- ✅ DDoS nhắm vào Cloudflare (họ chịu được) thay vì VPS nhỏ
- ✅ Attacker không biết IP thật của server

### Cloudflare có PoP tại Việt Nam

Cloudflare có **Points of Presence (PoP)** tại:
- **Hà Nội** (HAN)
- **TP. Hồ Chí Minh** (SGN)

→ Học sinh truy cập `dgnlmoingay.com` sẽ kết nối tới PoP gần nhất (~10-30ms) thay vì trực tiếp Hetzner Đức (~200ms).

> 📖 Hướng dẫn cài đặt chi tiết: [cloudflare-setup.md](cloudflare-setup.md)
