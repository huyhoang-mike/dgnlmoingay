# ☁️ Thiết lập Cloudflare CDN + SSL — ĐGNL Mỗi Ngày

> Hướng dẫn cấu hình **Cloudflare** để tăng tốc website cho học sinh Việt Nam khi VPS đặt tại Hetzner (Đức).
> Domain: `dgnlmoingay.edu.vn`

---

## Mục lục

1. [Tại sao cần Cloudflare?](#1-tại-sao-cần-cloudflare)
2. [Tạo tài khoản Cloudflare](#2-tạo-tài-khoản-cloudflare)
3. [Thêm domain vào Cloudflare](#3-thêm-domain-vào-cloudflare)
4. [Đổi Nameserver](#4-đổi-nameserver)
5. [Cấu hình DNS Records](#5-cấu-hình-dns-records)
6. [Cấu hình SSL/HTTPS](#6-cấu-hình-sslhttps)
7. [Tối ưu tốc độ cho Việt Nam](#7-tối-ưu-tốc-độ-cho-việt-nam)
8. [Cấu hình bảo mật](#8-cấu-hình-bảo-mật)
9. [Kiểm tra hoạt động](#9-kiểm-tra-hoạt-động)
10. [FAQ & Xử lý sự cố](#10-faq--xử-lý-sự-cố)

---

## 1. Tại sao cần Cloudflare?

### Vấn đề: VPS Hetzner ở Đức, học sinh ở Việt Nam

```
Không có Cloudflare:
  Học sinh (VN) ───── ~12,000 km ─────► Hetzner (Đức)
  Latency: ~200ms mỗi request
  Mỗi trang: 5-10 requests = 1-2 giây chờ đợi 😞

Có Cloudflare:
  Học sinh (VN) ──── ~10 km ────► Cloudflare PoP (HN/HCM)
  Latency: ~30ms (cache hit) ⚡
  Trang load gần như tức thì 🚀
```

### Cloudflare giải quyết

| Tính năng | Lợi ích | Giá |
|-----------|---------|-----|
| **CDN** | Cache tại Hà Nội + HCM | Miễn phí |
| **SSL/HTTPS** | Certificate tự động | Miễn phí |
| **DDoS Protection** | Chặn tấn công | Miễn phí |
| **Analytics** | Xem traffic | Miễn phí |
| **Auto Minify** | Nén JS/CSS/HTML | Miễn phí |
| **HTTP/3 + QUIC** | Giao thức nhanh hơn | Miễn phí |
| **IP ẩn** | VPS không bị tấn công trực tiếp | Miễn phí |

---

## 2. Tạo tài khoản Cloudflare

### Bước 2.1: Đăng ký

1. Truy cập [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Nhập email và password
3. Xác minh email

### Bước 2.2: Chọn gói

- Chọn **Free plan** — đủ cho dự án này
- Gói Free bao gồm CDN, SSL, DDoS protection, analytics

---

## 3. Thêm domain vào Cloudflare

### Bước 3.1: Add site

1. Trong Cloudflare Dashboard, click **"Add a site"** (hoặc **"+ Add site"**)
2. Nhập: `dgnlmoingay.edu.vn`
3. Click **"Add site"**
4. Chọn **Free plan** → **Continue**

### Bước 3.2: Cloudflare scan DNS

Cloudflare sẽ tự động scan DNS records hiện tại của domain. Review và tiếp tục:

- Nếu đã có A record trỏ về VPS → Cloudflare sẽ import
- Nếu chưa có → sẽ thêm ở bước 5

Click **"Continue"**

---

## 4. Đổi Nameserver

### Bước 4.1: Ghi lại Nameserver của Cloudflare

Cloudflare sẽ cho bạn 2 nameserver, ví dụ:

```
eric.ns.cloudflare.com
leah.ns.cloudflare.com
```

> ⚠️ Tên nameserver khác nhau cho mỗi tài khoản. Dùng tên Cloudflare cho BẠN.

### Bước 4.2: Đổi nameserver tại nhà đăng ký domain

Đăng nhập vào trang quản lý domain `.edu.vn` (ví dụ: PA Vietnam, Nhân Hòa, hoặc nơi bạn mua domain):

1. Vào phần **Quản lý DNS** hoặc **Nameserver**
2. Xóa nameserver cũ (của nhà đăng ký)
3. Thêm 2 nameserver của Cloudflare:
   ```
   eric.ns.cloudflare.com
   leah.ns.cloudflare.com
   ```
4. Lưu thay đổi

### Bước 4.3: Đợi cập nhật

- Thường mất **5 phút — 24 giờ**
- Cloudflare sẽ gửi email khi nameserver đã active
- Có thể kiểm tra: `nslookup -type=NS dgnlmoingay.edu.vn`

> 💡 Trong thời gian đợi, tiếp tục cấu hình các bước tiếp theo.

---

## 5. Cấu hình DNS Records

Trong Cloudflare Dashboard → chọn domain → **DNS** tab:

### Thêm/sửa các records sau

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| **A** | `@` | `65.109.xxx.xxx` (IP VPS Hetzner) | ☁️ Proxied | Auto |
| **A** | `www` | `65.109.xxx.xxx` (IP VPS Hetzner) | ☁️ Proxied | Auto |

> ⚠️ **Quan trọng:** Đảm bảo biểu tượng đám mây là **☁️ cam (Proxied)** — không phải ☁️ xám (DNS only). Proxied = traffic đi qua Cloudflare (CDN + SSL + bảo mật).

### Cách thêm record

1. Click **"+ Add record"**
2. Type: `A`
3. Name: `@` (cho domain gốc) hoặc `www`
4. IPv4 address: `65.109.xxx.xxx` (IP VPS của bạn)
5. Proxy status: **Proxied** (☁️ cam)
6. Click **Save**

---

## 6. Cấu hình SSL/HTTPS

### Bước 6.1: Chọn SSL Mode

Vào **SSL/TLS** → **Overview**:

Chọn: **Full**

```
📋 Giải thích các mode:

❌ Off:           Browser ← HTTP → Cloudflare ← HTTP → VPS
                  Không mã hóa gì cả

❌ Flexible:      Browser ← HTTPS → Cloudflare ← HTTP → VPS
                  Chỉ mã hóa nửa đường — KHÔNG AN TOÀN

✅ Full:          Browser ← HTTPS → Cloudflare ← HTTP → VPS
                  OK cho setup hiện tại (VPS chạy HTTP nội bộ)

⭐ Full (Strict): Browser ← HTTPS → Cloudflare ← HTTPS → VPS
                  Tốt nhất, nhưng cần cert trên VPS
```

> Chọn **Full** vì VPS chỉ chạy HTTP (port 80). Cloudflare xử lý HTTPS cho browser.

### Bước 6.2: Bật Always Use HTTPS

Vào **SSL/TLS** → **Edge Certificates**:

- **Always Use HTTPS**: ✅ Bật
  > Tự động redirect `http://` → `https://`

- **Minimum TLS Version**: `TLS 1.2`
  > Chặn các protocol cũ, kém bảo mật

- **Automatic HTTPS Rewrites**: ✅ Bật
  > Tự sửa link `http://` trong HTML thành `https://`

### Bước 6.3: Bật HSTS (HTTP Strict Transport Security)

Vào **SSL/TLS** → **Edge Certificates** → **HTTP Strict Transport Security (HSTS)**:

1. Click **Enable HSTS**
2. Cấu hình:
   - Max-Age: `6 months` (15768000 giây)
   - Include subdomains: ✅
   - No-Sniff: ✅
3. Tick xác nhận → **Save**

> HSTS bảo browser **luôn luôn** dùng HTTPS, ngay cả khi user gõ `http://`.

---

## 7. Tối ưu tốc độ cho Việt Nam

### Bước 7.1: Caching

Vào **Caching** → **Configuration**:

- **Caching Level**: Standard
- **Browser Cache TTL**: `4 hours` (cho HTML) — Cloudflare tự set tốt hơn cho JS/CSS

### Bước 7.2: Tạo Cache Rule cho static assets

Vào **Caching** → **Cache Rules** → **Create rule**:

**Rule 1: Cache static assets lâu hơn**

```
Tên: Cache Static Assets
Khi: URI Path contains /assets/ OR File extension matches js,css,png,jpg,svg,woff2,ico
Thì: Eligible for cache = ON, Edge TTL = 1 month, Browser TTL = 1 month
```

### Bước 7.3: Speed Optimization

Vào **Speed** → **Optimization**:

**Content Optimization:**
- **Auto Minify**: ✅ JavaScript, ✅ CSS, ✅ HTML
- **Brotli**: ✅ Bật (nén tốt hơn gzip ~15-20%)

**Protocol Optimization:**
- **HTTP/2**: ✅ (tự bật mặc định)
- **HTTP/3 (with QUIC)**: ✅ Bật
  > QUIC giúp giảm latency đáng kể cho kết nối từ xa (VN → Đức)

**Image Optimization (Free plan):**
- **Rocket Loader**: ❌ Tắt
  > Có thể gây lỗi với React SPA, không khuyến nghị
- **Early Hints**: ✅ Bật
  > Browser tải tài nguyên sớm hơn

### Bước 7.4: Page Rules (tùy chọn)

Vào **Rules** → **Page Rules**:

**Rule 1: Không cache API**

```
URL: dgnlmoingay.edu.vn/api/*
Setting: Cache Level = Bypass
```

> Đảm bảo API response luôn fresh, không bị cache.

---

## 8. Cấu hình bảo mật

### Bước 8.1: WAF (Web Application Firewall)

Vào **Security** → **WAF**:

- **Managed Ruleset**: ✅ Bật (Free plan có basic protection)

### Bước 8.2: Bot Protection

Vào **Security** → **Bots**:

- **Bot Fight Mode**: ✅ Bật
  > Chặn bot spam, crawlers xấu

### Bước 8.3: Security Level

Vào **Security** → **Settings**:

- **Security Level**: `Medium`
  > `Low` cho ít challenge, `High` sẽ bắt user giải CAPTCHA nhiều

- **Challenge Passage**: `30 minutes`

### Bước 8.4: Under Attack Mode (khi bị tấn công)

Nếu website bị DDoS/spam:

1. Vào **Security** → **Settings**
2. Bật **"I'm Under Attack"** mode
3. Mọi visitor sẽ phải đợi 5 giây (JavaScript challenge)
4. **Nhớ tắt** sau khi hết tấn công

---

## 9. Kiểm tra hoạt động

### Bước 9.1: Kiểm tra DNS

```bash
# Từ máy local
nslookup dgnlmoingay.edu.vn

# Kết quả nên là IP Cloudflare (104.21.x.x hoặc 172.67.x.x)
# KHÔNG phải IP VPS trực tiếp
```

### Bước 9.2: Kiểm tra HTTPS

Truy cập `https://dgnlmoingay.edu.vn` trên browser:

- ✅ 🔒 trên thanh URL
- ✅ Certificate issued by: Cloudflare (hoặc Google Trust Services)
- ✅ Trang web load bình thường

### Bước 9.3: Kiểm tra redirect

```bash
# HTTP tự redirect sang HTTPS
curl -I http://dgnlmoingay.edu.vn
# HTTP/1.1 301 Moved Permanently
# Location: https://dgnlmoingay.edu.vn/
```

### Bước 9.4: Kiểm tra API

```bash
curl https://dgnlmoingay.edu.vn/api/health
# {"status":"healthy","app":"ĐGNL Mỗi Ngày"}
```

### Bước 9.5: Kiểm tra tốc độ

1. Truy cập [https://tools.pingdom.com/](https://tools.pingdom.com/)
2. Nhập `https://dgnlmoingay.edu.vn`
3. Chọn location: **Asia - Tokyo** (gần VN nhất)
4. Kết quả nên < 2 giây load time

Hoặc dùng Google PageSpeed:
- [https://pagespeed.web.dev/](https://pagespeed.web.dev/)
- Nhập URL → kiểm tra điểm Performance

### Bước 9.6: Xem Analytics

Trong Cloudflare Dashboard → **Analytics**:

- **Traffic**: Số request, bandwidth
- **Security**: Threats blocked
- **Performance**: Cache hit ratio
- **DNS**: Query volume

> 💡 Cache hit ratio nên > 70% sau vài ngày hoạt động. Nghĩa là 70%+ request được phục vụ từ PoP VN mà không cần đi tới Hetzner Đức.

---

## 10. FAQ & Xử lý sự cố

### Q: Website hiện "Error 522: Connection timed out"?

**A:** VPS Hetzner không phản hồi. Kiểm tra:
1. VPS có đang chạy không? SSH vào kiểm tra
2. `docker compose ps` — containers có running?
3. Firewall có mở port 80? `ufw status`
4. Nginx có đang listen port 80? `docker compose logs nginx`

### Q: Website hiện "Error 521: Web server is down"?

**A:** VPS từ chối kết nối:
1. Nginx container có chạy? `docker compose restart nginx`
2. Port 80 có bị chiếm bởi process khác? `ss -tlnp | grep :80`

### Q: Website hiện "Error 526: Invalid SSL certificate"?

**A:** SSL mode sai. Vào **SSL/TLS** → chọn **Full** (không phải Full Strict).

### Q: API trả về lỗi nhưng frontend OK?

**A:** Kiểm tra:
1. Cloudflare có cache API không? Thêm Page Rule bypass cho `/api/*`
2. Backend container running? `docker compose logs backend`

### Q: Google Login không hoạt động sau khi setup Cloudflare?

**A:** Cần cập nhật Google Cloud Console:
1. Vào **APIs & Services** → **Credentials**
2. Thêm vào **Authorized JavaScript origins**:
   - `https://dgnlmoingay.edu.vn`
   - `https://www.dgnlmoingay.edu.vn`
3. Thêm vào **Authorized redirect URIs**:
   - `https://dgnlmoingay.edu.vn`
   - `https://www.dgnlmoingay.edu.vn`

### Q: Tôi muốn truy cập VPS trực tiếp (bypass Cloudflare)?

**A:** Dùng IP trực tiếp: `http://65.109.xxx.xxx` (chỉ HTTP, không có SSL). Nhưng không nên để public — chỉ dùng để debug.

### Q: Cloudflare PoP Việt Nam có thật sự hoạt động?

**A:** Kiểm tra:
```bash
curl -I https://dgnlmoingay.edu.vn
# Tìm header: cf-ray: xxxxx-HAN (Hà Nội) hoặc xxxxx-SGN (HCM)
```

Nếu thấy `-HAN` hoặc `-SGN` → đang dùng PoP Việt Nam ✅

---

## Tóm tắt cấu hình Cloudflare

| Mục | Giá trị |
|-----|---------|
| **Plan** | Free |
| **DNS** | A record `@` + `www` → IP VPS (☁️ Proxied) |
| **SSL Mode** | Full |
| **Always HTTPS** | ✅ |
| **HSTS** | ✅ 6 months |
| **Auto Minify** | ✅ JS + CSS + HTML |
| **Brotli** | ✅ |
| **HTTP/3** | ✅ |
| **Bot Fight Mode** | ✅ |
| **Cache API** | ❌ Bypass `/api/*` |
| **Rocket Loader** | ❌ Tắt |
