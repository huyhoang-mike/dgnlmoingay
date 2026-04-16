# CI/CD: GitHub Actions → Hetzner VPS

Hướng dẫn thiết lập tự động deploy khi push code lên GitHub.

## Tổng quan

```
Push code → GitHub Actions → SSH vào VPS → Pull code → Rebuild containers
```

---

## 1. Tạo SSH Key cho GitHub Actions

Trên **máy local** (hoặc trên VPS):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy
```

Copy **public key** lên VPS:

```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub root@<VPS_IP>
```

Kiểm tra kết nối:

```bash
ssh -i ~/.ssh/github_deploy root@<VPS_IP> "echo OK"
```

## 2. Thêm Secrets vào GitHub Repository

Vào **Settings → Secrets and variables → Actions → New repository secret**:

| Secret Name     | Giá trị                                     |
| --------------- | ------------------------------------------- |
| `VPS_HOST`      | IP hoặc domain VPS (ví dụ `5.78.xx.xx`)    |
| `VPS_USER`      | `root` (hoặc user deploy)                   |
| `VPS_SSH_KEY`   | Nội dung file `~/.ssh/github_deploy` (**private key**) |
| `VPS_PORT`      | `22` (hoặc port SSH đã đổi)                 |

## 3. Tạo GitHub Actions Workflow

Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Hetzner VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            cd /opt/dgnlmoingay
            git pull origin main
            docker compose down
            docker compose up --build -d
            docker image prune -f
```

## 4. Cấu trúc thư mục trên VPS

```bash
# Lần đầu tiên trên VPS:
cd /opt
git clone git@github.com:<username>/dgnlmoingay.git
cd dgnlmoingay

# Copy file .env lên VPS (chỉ 1 lần, KHÔNG push lên GitHub)
scp .env.production root@<VPS_IP>:/opt/dgnlmoingay/.env

# Khởi chạy lần đầu
docker compose up --build -d
```

## 5. Workflow nâng cao (tuỳ chọn)

### 5a. Chỉ deploy khi backend hoặc frontend thay đổi

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'frontend/**'
      - 'nginx/**'
      - 'docker-compose.yml'
```

### 5b. Thêm bước kiểm tra trước khi deploy

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: |
          cd backend
          pip install -r requirements.txt
          python -m pytest tests/ -v
        continue-on-error: false

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            cd /opt/dgnlmoingay
            git pull origin main
            docker compose down
            docker compose up --build -d
            docker image prune -f
```

### 5c. Zero-downtime deploy

```yaml
script: |
  cd /opt/dgnlmoingay
  git pull origin main
  docker compose build
  docker compose up -d --no-deps --build backend
  docker compose up -d --no-deps --build frontend
  docker compose up -d --no-deps nginx
  docker image prune -f
```

## 6. Deploy thủ công (không dùng CI/CD)

Nếu chưa muốn dùng GitHub Actions, SSH vào VPS và chạy:

```bash
ssh root@<VPS_IP>
cd /opt/dgnlmoingay
git pull origin main
docker compose down && docker compose up --build -d
```

## 7. Rollback

```bash
ssh root@<VPS_IP>
cd /opt/dgnlmoingay
git log --oneline -5          # Xem 5 commit gần nhất
git checkout <commit_hash>    # Quay lại commit cũ
docker compose down && docker compose up --build -d
```

---

## Checklist trước khi bật CI/CD

- [ ] VPS đã cài Docker + Docker Compose
- [ ] Repo đã clone vào `/opt/dgnlmoingay` trên VPS
- [ ] File `.env` đã copy lên VPS
- [ ] SSH key đã thêm vào GitHub Secrets
- [ ] File `.github/workflows/deploy.yml` đã push lên `main`
- [ ] Test thử bằng cách push 1 commit nhỏ

> **Xem thêm:** [VPS Setup](vps-setup.md) · [Cloudflare Setup](cloudflare-setup.md) · [Deployment Guide](deployment-guide.md)
