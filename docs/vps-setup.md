# 📋 Hướng dẫn Cài đặt VPS Hetzner — ĐGNL Mỗi Ngày

> Hướng dẫn chi tiết từng bước để triển khai ứng dụng trên **Hetzner Cloud VPS**.
> Domain: `dgnlmoingay.com` | CDN/SSL: Cloudflare

---

## Mục lục

1. [Tạo VPS trên Hetzner Cloud](#1-tạo-vps-trên-hetzner-cloud)
2. [Kết nối SSH lần đầu](#2-kết-nối-ssh-lần-đầu)
3. [Bảo mật VPS cơ bản](#3-bảo-mật-vps-cơ-bản)
4. [Cài đặt Docker](#4-cài-đặt-docker)
5. [Deploy ứng dụng](#5-deploy-ứng-dụng)
6. [Tạo admin đầu tiên](#6-tạo-admin-đầu-tiên)
7. [Thiết lập Database Backup](#7-thiết-lập-database-backup)
8. [Cập nhật ứng dụng](#8-cập-nhật-ứng-dụng)
9. [Monitoring & Xử lý sự cố](#9-monitoring--xử-lý-sự-cố)

---

## 1. Tạo VPS trên Hetzner Cloud

### Bước 1.1: Tạo tài khoản Hetzner

1. Truy cập [https://console.hetzner.cloud/](https://console.hetzner.cloud/)
2. Đăng ký tài khoản (cần thẻ Visa/Mastercard)
3. Xác minh email

### Bước 1.2: Tạo project mới

1. Trong Hetzner Console, click **+ New Project**
2. Đặt tên: `DGNL Moi Ngay`
3. Click vào project vừa tạo

### Bước 1.3: Thêm SSH Key (khuyến nghị)

> Làm bước này **TRƯỚC** khi tạo server để Hetzner tự cài SSH key.

**Trên máy Windows (PowerShell):**

```powershell
# Kiểm tra đã có SSH key chưa
Test-Path $HOME\.ssh\id_ed25519.pub

# Nếu chưa có, tạo SSH key mới
ssh-keygen -t ed25519 -C "your-email@example.com"
# Nhấn Enter 3 lần (dùng đường dẫn mặc định, không cần passphrase)

# Xem public key (copy nội dung này)
Get-Content $HOME\.ssh\id_ed25519.pub
```

**Trên Hetzner Console:**

1. Vào **Security** → **SSH Keys** → **Add SSH Key**
2. Paste nội dung public key vào
3. Đặt tên: `My Windows PC`
4. Click **Add SSH Key**

### Bước 1.4: Tạo Server

1. Click **Add Server** trong project
2. Cấu hình:

| Mục | Chọn | Ghi chú |
|-----|------|---------|
| **Location** | Falkenstein (fsn1) hoặc Nuremberg (nbg1) | Gần nhất với châu Á |
| **Image** | Ubuntu 24.04 | Hoặc 22.04 LTS |
| **Type** | CX22 (2 vCPU, 4GB RAM, 40GB SSD) | €4.51/tháng — đủ cho dự án |
| **SSH Key** | Chọn key vừa thêm | ✅ Quan trọng |
| **Name** | `dgnl-production` | Tên tùy ý |

3. Click **Create & Buy Now**
4. **Ghi lại IP** của server (ví dụ: `65.109.xxx.xxx`)

> 💡 **Gói CX22** (2 vCPU, 4GB RAM, 40GB SSD, 20TB traffic) là đủ cho ~200-500 học sinh đồng thời.

---

## 2. Kết nối SSH lần đầu

### Bước 2.1: Kết nối từ Windows

```powershell
# Kết nối bằng SSH key (không cần password)
ssh root@65.109.xxx.xxx

# Lần đầu sẽ hỏi fingerprint → gõ "yes"
# The authenticity of host '65.109.xxx.xxx' can't be established.
# Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
```

### Bước 2.2: Kiểm tra server

```bash
# Sau khi SSH thành công, bạn sẽ thấy:
# root@dgnl-production:~#

# Kiểm tra hệ thống
hostname
cat /etc/os-release
free -h              # RAM
df -h                # Disk
nproc                # Số CPU
```

---

## 3. Bảo mật VPS cơ bản

### Bước 3.1: Cập nhật hệ thống

```bash
apt update && apt upgrade -y
```

### Bước 3.2: Cài Firewall (UFW)

```bash
# Cài UFW
apt install ufw -y

# ⚠️ QUAN TRỌNG: Allow SSH TRƯỚC khi enable
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP (cho Cloudflare)
ufw allow 443/tcp    # HTTPS (dự phòng)

# Bật firewall
ufw enable
# Gõ "y" khi được hỏi

# Kiểm tra
ufw status
```

Kết quả mong đợi:

```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### Bước 3.3: Cài Fail2Ban (chống brute-force SSH)

```bash
apt install fail2ban -y

# Fail2Ban tự chạy với cấu hình mặc định (ban IP sau 5 lần login sai)
systemctl enable fail2ban
systemctl start fail2ban

# Kiểm tra
fail2ban-client status sshd
```

### Bước 3.4: Tắt SSH bằng password (nếu đã dùng SSH key)

```bash
# Chỉnh sửa cấu hình SSH
nano /etc/ssh/sshd_config

# Tìm và sửa các dòng sau:
# PasswordAuthentication yes  →  PasswordAuthentication no
# PermitRootLogin yes         →  PermitRootLogin prohibit-password

# Lưu file: Ctrl+O → Enter → Ctrl+X

# Restart SSH
systemctl restart sshd
```

> ⚠️ **Trước khi đóng terminal**, mở terminal MỚI và thử SSH lại để đảm bảo vẫn kết nối được.

---

## 4. Cài đặt Docker

### Bước 4.1: Cài Docker Engine

```bash
# Cài Docker bằng script chính thức
curl -fsSL https://get.docker.com | sh

# Kiểm tra
docker --version
# Docker version 27.x.x, build xxxxx
```

### Bước 4.2: Cài Docker Compose plugin

```bash
apt install docker-compose-plugin -y

# Kiểm tra
docker compose version
# Docker Compose version v2.x.x
```

### Bước 4.3: Cài Git

```bash
apt install git -y
git --version
```

---

## 5. Deploy ứng dụng

### Bước 5.1: Clone repository

```bash
# Clone code từ GitHub
git clone https://github.com/YOUR_USERNAME/dgnlmoingay.git /opt/dgnlmoingay
cd /opt/dgnlmoingay
```

### Bước 5.2: Tạo file `.env` production

```bash
# Copy template
cp .env.example .env

# Tạo mật khẩu mạnh
echo "=== Passwords ==="
echo "DB_PASS: $(openssl rand -hex 16)"
echo "SECRET:  $(openssl rand -hex 32)"
echo "================="

# Chỉnh sửa .env với các giá trị vừa tạo
nano .env
```

> 📖 Xem hướng dẫn chi tiết về quản lý mật khẩu tại [deployment-guide.md](deployment-guide.md#2-quản-lý-mật-khẩu--biến-môi-trường)

Nội dung `.env` cần điền:

```env
# ── Database ──────────────────────────────────
POSTGRES_USER=dgnl_user
POSTGRES_PASSWORD=<paste-DB_PASS-ở-trên>
POSTGRES_DB=dgnl_db
DATABASE_URL=postgresql+asyncpg://dgnl_user:<paste-DB_PASS-ở-trên>@db:5432/dgnl_db

# ── Security ─────────────────────────────────
SECRET_KEY=<paste-SECRET-ở-trên>
ALLOWED_ORIGINS=https://dgnlmoingay.com,https://www.dgnlmoingay.com

# ── Google OAuth ─────────────────────────────
GOOGLE_CLIENT_ID=your-real-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your-real-client-id.apps.googleusercontent.com

# ── Frontend ─────────────────────────────────
VITE_API_URL=/api

# ── Environment ──────────────────────────────
ENVIRONMENT=production
```

> ⚠️ **Nhớ:** `POSTGRES_PASSWORD` và password trong `DATABASE_URL` phải **GIỐNG NHAU**.

Lưu file: `Ctrl+O` → `Enter` → `Ctrl+X`

### Bước 5.3: Build và chạy

```bash
# Build tất cả images (lần đầu mất 3-5 phút)
docker compose up --build -d

# Kiểm tra tất cả containers đang chạy
docker compose ps
```

Kết quả mong đợi:

```
NAME             IMAGE                STATUS                    PORTS
dgnl_db          postgres:16-alpine   Up (healthy)
dgnl_backend     ...                  Up
dgnl_frontend    ...                  Up
dgnl_nginx       nginx:alpine         Up             0.0.0.0:80->80/tcp
```

### Bước 5.4: Kiểm tra

```bash
# Test health endpoint
curl http://localhost/api/health
# Kết quả: {"status":"healthy","app":"ĐGNL Mỗi Ngày"}

# Test frontend
curl -I http://localhost/
# Kết quả: HTTP/1.1 200 OK

# Xem logs nếu có lỗi
docker compose logs -f backend --tail 50
docker compose logs -f nginx --tail 50
```

### Bước 5.5: Thiết lập Cloudflare

> Tiếp tục theo hướng dẫn tại [cloudflare-setup.md](cloudflare-setup.md) để:
> - Trỏ domain `dgnlmoingay.com` về IP VPS
> - Bật SSL/HTTPS tự động
> - Bật CDN cache cho học sinh Việt Nam

---

## 6. Tạo admin đầu tiên

Sau khi deploy và Cloudflare hoạt động:

### Bước 6.1: Đăng nhập Google trên website

1. Truy cập `https://dgnlmoingay.com`
2. Click **"Đăng nhập bằng Google"**
3. Đăng nhập bằng tài khoản Google của admin
4. Tài khoản được tạo tự động trong database

### Bước 6.2: Cấp quyền admin qua database

```bash
cd /opt/dgnlmoingay

# Kết nối vào database
docker compose exec db psql -U dgnl_user -d dgnl_db

# Trong SQL shell, chạy:
UPDATE users SET is_admin = true, is_enrolled = true
WHERE email = 'your-admin-email@gmail.com';

# Kiểm tra
SELECT email, is_admin, is_enrolled FROM users;

# Thoát
\q
```

### Bước 6.3: Kiểm tra

1. Refresh trang web
2. Click avatar → phải thấy menu **"Quản lý học viên"**
3. Truy cập `https://dgnlmoingay.com/admin` → Admin Panel

---

## 7. Thiết lập Database Backup

### Bước 7.1: Tạo thư mục backup

```bash
mkdir -p /backups
```

### Bước 7.2: Test backup thủ công

```bash
# Tạo 1 bản backup test
docker compose -f /opt/dgnlmoingay/docker-compose.yml exec -T db \
    pg_dump -U dgnl_user dgnl_db | gzip > /backups/dgnl_test.sql.gz

# Kiểm tra file
ls -lh /backups/
```

### Bước 7.3: Thiết lập backup tự động (crontab)

```bash
# Mở crontab editor
crontab -e
# Chọn nano nếu được hỏi (nhấn 1)

# Thêm 2 dòng sau vào cuối file:
0 2 * * * docker compose -f /opt/dgnlmoingay/docker-compose.yml exec -T db pg_dump -U dgnl_user dgnl_db | gzip > /backups/dgnl_$(date +\%Y\%m\%d).sql.gz
0 3 * * * find /backups/ -name "dgnl_*.sql.gz" -mtime +30 -delete

# Lưu: Ctrl+O → Enter → Ctrl+X
```

**Giải thích:**
- Dòng 1: Mỗi ngày lúc 2:00 sáng (UTC) → tạo backup nén
- Dòng 2: Mỗi ngày lúc 3:00 sáng → xóa backup cũ hơn 30 ngày

### Bước 7.4: Khôi phục từ backup (khi cần)

```bash
# Giải nén và khôi phục
gunzip -c /backups/dgnl_20260416.sql.gz | \
    docker compose -f /opt/dgnlmoingay/docker-compose.yml exec -T db \
    psql -U dgnl_user -d dgnl_db
```

---

## 8. Cập nhật ứng dụng

Khi bạn push code mới lên GitHub:

```bash
# SSH vào VPS
ssh root@65.109.xxx.xxx

# Vào thư mục project
cd /opt/dgnlmoingay

# Lấy code mới
git pull origin main

# Rebuild và restart (chỉ rebuild service thay đổi)
docker compose up --build -d

# Kiểm tra
docker compose ps
curl https://dgnlmoingay.com/api/health
```

### Cập nhật chỉ backend

```bash
docker compose build --no-cache backend
docker compose up -d backend
```

### Cập nhật chỉ frontend

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
# Nginx cũng cần restart vì frontend image thay đổi
docker compose restart nginx
```

---

## 9. Monitoring & Xử lý sự cố

### Kiểm tra nhanh

```bash
# Tất cả containers chạy?
docker compose ps

# Health check API
curl -s https://dgnlmoingay.com/api/health | python3 -m json.tool

# RAM & CPU
docker stats --no-stream

# Disk
df -h
```

### Xem logs

```bash
# Tất cả services
docker compose logs -f --tail 100

# Chỉ backend (xem lỗi)
docker compose logs -f backend --tail 100

# Chỉ nginx (xem traffic)
docker compose logs -f nginx --tail 100

# Tìm lỗi cụ thể
docker compose logs backend 2>&1 | grep -i "error\|exception"
```

### Restart service bị lỗi

```bash
# Restart 1 service
docker compose restart backend

# Restart tất cả
docker compose restart

# Nếu cần recreate (rebuild)
docker compose up --build -d
```

### Dọn dẹp Docker (khi disk đầy)

```bash
# Xem dung lượng Docker
docker system df

# Dọn images/containers cũ (không ảnh hưởng đang chạy)
docker system prune -a --volumes
# ⚠️ Flag --volumes sẽ xóa volumes không dùng — cẩn thận
```

### Sự cố thường gặp

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|------------|-----------|
| 502 Bad Gateway | Backend chưa start xong | Đợi 30s, kiểm tra `docker compose logs backend` |
| Database connection refused | Password sai trong .env | Kiểm tra `POSTGRES_PASSWORD` = password trong `DATABASE_URL` |
| Google login lỗi | Domain chưa thêm vào Google Console | Xem [google-auth-setup.md](google-auth-setup.md) |
| "Permission denied" SSH | SSH key sai | Kiểm tra `~/.ssh/id_ed25519` có đúng key |
| Disk full | Docker images cũ | Chạy `docker system prune -a` |
| High memory | Backend workers quá nhiều | Giảm `--workers` trong Dockerfile |
