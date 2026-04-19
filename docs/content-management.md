# 📹 Quản lý Video & Tài liệu — ĐGNL Mỗi Ngày
# Content Management Guide

Hướng dẫn chi tiết cách thêm, cập nhật, và duy trì video bài giảng và tài liệu PDF
trong ứng dụng ĐGNL Mỗi Ngày.

---

## Mục lục

1. [Tổng quan cách hoạt động](#1-tổng-quan-cách-hoạt-động)
2. [Chuẩn bị file trên Google Drive](#2-chuẩn-bị-file-trên-google-drive)
3. [Thêm bài học mới qua API](#3-thêm-bài-học-mới-qua-api)
4. [Cập nhật video / PDF của bài học](#4-cập-nhật-video--pdf-của-bài-học)
5. [Xoá bài học](#5-xoá-bài-học)
6. [Quản lý hàng loạt (Bulk)](#6-quản-lý-hàng-loạt-bulk)
7. [Cách lấy Google Drive File ID](#7-cách-lấy-google-drive-file-id)
8. [Cấu hình quyền Google Drive](#8-cấu-hình-quyền-google-drive)
9. [Xử lý sự cố](#9-xử-lý-sự-cố)

---

## 1. Tổng quan cách hoạt động

Mỗi bài học (lesson) trong database có 2 trường quan trọng cho media:

| Trường           | Mô tả                                      | Ví dụ                              |
|------------------|---------------------------------------------|-------------------------------------|
| `video_drive_id` | Google Drive File ID của video bài giảng    | `1aBcDeFgHiJkLmNoPqRsTuVwXyZ`     |
| `pdf_drive_id`   | Google Drive File ID của tài liệu PDF       | `2xYzAbCdEfGhIjKlMnOpQrStUv`     |

**Luồng hoạt động:**

```
Google Drive (video/PDF) ──File ID──▶ Database (lessons table)
                                           │
                                           ▼
                                      FastAPI API
                                           │
                                           ▼
                                    React Frontend
                                     ├── VideoPlayer  → iframe embed: drive.google.com/file/d/{ID}/preview
                                     └── PDFMaterial  → iframe preview + download link
```

Bạn **không cần upload file lên server**. Tất cả media được host trên Google Drive
và nhúng (embed) qua iframe bằng File ID.

---

## 2. Chuẩn bị file trên Google Drive

### 2.1 Upload video

1. Vào [Google Drive](https://drive.google.com)
2. Tạo folder cho khoá học: `ĐGNL Mỗi Ngày / Videos`
3. Upload file video (khuyến nghị: MP4, tối đa 5GB)
4. **Bắt buộc** — Chia sẻ quyền xem:
   - Click chuột phải → **Chia sẻ** → **Chung**
   - Chọn: **"Bất kỳ ai có đường liên kết"** → **Người xem**
   - Nhấn **Xong**

### 2.2 Upload PDF

1. Tạo folder: `ĐGNL Mỗi Ngày / Materials`
2. Upload file PDF
3. Chia sẻ quyền **"Bất kỳ ai có đường liên kết"** → **Người xem** (giống video)

### 2.3 Tổ chức folder khuyến nghị

```
📂 ĐGNL Mỗi Ngày/
├── 📂 Videos/
│   ├── 01-gioi-thieu-dgnl.mp4
│   ├── 02-tu-duy-logic.mp4
│   └── ...
├── 📂 Materials/
│   ├── 01-gioi-thieu-dgnl.pdf
│   ├── 02-tu-duy-logic.pdf
│   └── ...
└── 📄 Danh sách File IDs.xlsx    ← (tuỳ chọn) theo dõi ID
```

---

## 3. Thêm bài học mới qua API

### Cách 1: Dùng Swagger UI (Giao diện web)

1. Mở trình duyệt → `http://localhost/docs` (hoặc `http://your-domain/docs`)
2. Tìm **POST /api/lessons/**
3. Click **Try it out**
4. Nhập JSON body:

```json
{
  "title": "Bài 1: Giới thiệu DGNL",
  "description": "Tổng quan về kỳ thi Đánh giá Năng lực ĐHQG",
  "order": 1,
  "video_drive_id": "1aBcDeFgHiJkLmNoPqRsTuVwXyZ",
  "pdf_drive_id": "2xYzAbCdEfGhIjKlMnOpQrStUv",
  "content": "## Nội dung\n\nĐây là nội dung bài học...",
  "is_published": true
}
```

5. Click **Execute**

### Cách 2: Dùng cURL (Terminal)

```bash
curl -X POST http://localhost/api/lessons/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bài 1: Giới thiệu DGNL",
    "description": "Tổng quan về kỳ thi DGNL",
    "order": 1,
    "video_drive_id": "1aBcDeFgHiJkLmNoPqRsTuVwXyZ",
    "pdf_drive_id": "2xYzAbCdEfGhIjKlMnOpQrStUv",
    "content": "Nội dung bài học ở đây...",
    "is_published": true
  }'
```

### Cách 3: Dùng PowerShell (Windows)

```powershell
$body = @{
    title          = "Bài 1: Giới thiệu DGNL"
    description    = "Tổng quan về kỳ thi DGNL"
    order          = 1
    video_drive_id = "1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
    pdf_drive_id   = "2xYzAbCdEfGhIjKlMnOpQrStUv"
    content        = "Nội dung bài học ở đây..."
    is_published   = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost/api/lessons/" `
    -Method POST -ContentType "application/json" -Body $body
```

### Giải thích các trường

| Trường           | Bắt buộc | Mô tả                                                              |
|------------------|----------|---------------------------------------------------------------------|
| `title`          | ✅ Có    | Tên bài học hiển thị trên sidebar                                   |
| `description`    | Không    | Mô tả ngắn hiển thị trên trang bài học                             |
| `order`          | Không    | Thứ tự sắp xếp (1, 2, 3...). Mặc định: 0                          |
| `video_drive_id` | Không    | Google Drive File ID của video. Để `null` nếu chưa có              |
| `pdf_drive_id`   | Không    | Google Drive File ID của PDF. Để `null` nếu chưa có                |
| `content`        | Không    | Nội dung text bài học (hỗ trợ Markdown-like formatting)             |
| `is_published`   | Không    | `true` = hiển thị cho học sinh, `false` = ẩn. Mặc định: `false`   |

---

## 4. Cập nhật video / PDF của bài học

### Thay video mới

Chỉ cần update `video_drive_id` — không cần thay đổi gì khác:

```bash
# Cập nhật video cho bài học ID=1
curl -X PUT http://localhost/api/lessons/1 \
  -H "Content-Type: application/json" \
  -d '{"video_drive_id": "NEW_GOOGLE_DRIVE_FILE_ID"}'
```

### Thêm PDF cho bài học đã có

```bash
curl -X PUT http://localhost/api/lessons/1 \
  -H "Content-Type: application/json" \
  -d '{"pdf_drive_id": "PDF_GOOGLE_DRIVE_FILE_ID"}'
```

### Xoá video/PDF (đặt về trống)

```bash
curl -X PUT http://localhost/api/lessons/1 \
  -H "Content-Type: application/json" \
  -d '{"video_drive_id": null}'
```

### Cập nhật nhiều trường cùng lúc

```bash
curl -X PUT http://localhost/api/lessons/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tên mới cho bài học",
    "video_drive_id": "NEW_VIDEO_ID",
    "pdf_drive_id": "NEW_PDF_ID",
    "content": "Nội dung cập nhật...",
    "is_published": true
  }'
```

> 💡 **Mẹo:** Bạn chỉ cần gửi các trường muốn thay đổi. Các trường không gửi sẽ giữ nguyên.

---

## 5. Xoá bài học

### Cách 1: Xóa trực tiếp trên Admin Dashboard (khuyến nghị)

1. Vào trang `Admin` → tab `Nội dung`.
2. Tìm bài giảng cần xóa.
3. Nhấn icon thùng rác ở cột `Xóa` (desktop) hoặc nút thùng rác trong card (mobile).
4. Xác nhận popup.

Sau khi xác nhận, bài giảng sẽ bị xóa ngay khỏi database và khỏi danh sách hiển thị.

> ⚠️ Lưu ý: thao tác này không thể hoàn tác từ UI.

### Cách 2: Xóa qua API

```bash
curl -X DELETE http://localhost/api/lessons/3
```

### Cách 3: Xóa qua SQL (khi cần dọn dữ liệu trùng)

```sql
-- Xóa bài giảng theo ID
DELETE FROM lessons WHERE id = 3;

-- Xóa nhiều bài cùng lúc
DELETE FROM lessons WHERE id IN (3, 7, 12);
```

> ⚠️ **Cảnh báo:** Thao tác này không thể hoàn tác. Hãy chắc chắn trước khi xoá.

Để xử lý các bài giảng trùng link Drive (khác tên nhưng cùng video/PDF), xem thêm phần SQL nâng cao trong tài liệu `docs/database-guide.md`.

---

## 6. Quản lý hàng loạt (Bulk)

### Script thêm nhiều bài học cùng lúc

Tạo file `seed_lessons.sh`:

```bash
#!/bin/bash
API="http://localhost/api/lessons/"

# Bài 1
curl -s -X POST $API -H "Content-Type: application/json" -d '{
  "title": "Giới thiệu DGNL",
  "order": 1,
  "video_drive_id": "YOUR_VIDEO_ID_1",
  "pdf_drive_id": "YOUR_PDF_ID_1",
  "content": "Nội dung bài 1...",
  "is_published": true
}'

# Bài 2
curl -s -X POST $API -H "Content-Type: application/json" -d '{
  "title": "Tư duy logic",
  "order": 2,
  "video_drive_id": "YOUR_VIDEO_ID_2",
  "pdf_drive_id": "YOUR_PDF_ID_2",
  "content": "Nội dung bài 2...",
  "is_published": true
}'

echo "Done seeding lessons!"
```

### PowerShell version (`seed_lessons.ps1`):

```powershell
$API = "http://localhost/api/lessons/"

$lessons = @(
    @{ title="Giới thiệu DGNL";    order=1; video_drive_id="ID1"; pdf_drive_id="PDF1"; is_published=$true },
    @{ title="Tư duy logic";        order=2; video_drive_id="ID2"; pdf_drive_id="PDF2"; is_published=$true },
    @{ title="Phân tích đọc hiểu";  order=3; video_drive_id="ID3"; pdf_drive_id="PDF3"; is_published=$true }
)

foreach ($lesson in $lessons) {
    $json = $lesson | ConvertTo-Json
    Invoke-RestMethod -Uri $API -Method POST -ContentType "application/json" -Body $json
    Write-Host "Created: $($lesson.title)"
}
```

---

## 7. Cách lấy Google Drive File ID

### Từ URL chia sẻ

Khi bạn chia sẻ file trên Google Drive, URL có dạng:

```
https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/view?usp=sharing
                                 └───────────────────────────┘
                                        ĐÂY LÀ FILE ID
```

**File ID** là chuỗi ký tự nằm giữa `/d/` và `/view`.

### Ví dụ thực tế

| URL gốc                                                          | File ID                        |
|-------------------------------------------------------------------|--------------------------------|
| `https://drive.google.com/file/d/1AbC123xYz/view?usp=sharing`   | `1AbC123xYz`                  |
| `https://drive.google.com/file/d/0B1234567890/view`              | `0B1234567890`                |

### Từ Google Drive UI

1. Click chuột phải vào file → **Lấy đường liên kết**
2. Copy link
3. Trích xuất phần File ID từ URL (phần giữa `/d/` và `/view`)

---

## 8. Cấu hình quyền Google Drive

### ⚠️ QUAN TRỌNG — Điều kiện bắt buộc

Để video và PDF hiển thị trong app, file **PHẢI** được chia sẻ public:

```
Chuột phải → Chia sẻ → Quyền truy cập chung
→ "Bất kỳ ai có đường liên kết" → Người xem
```

### Nếu muốn giới hạn truy cập

Nếu bạn không muốn chia sẻ public, có 2 lựa chọn:

1. **Chia sẻ trong tổ chức (Google Workspace):** Chọn "Bất kỳ ai trong tổ chức"
   - Chỉ hoạt động nếu user đăng nhập cùng tổ chức

2. **Download rồi tự host (nâng cao):**
   - Download video → Upload lên VPS / S3 / Cloudflare R2
   - Sửa `VideoPlayer.jsx` để dùng URL trực tiếp thay vì Drive embed
   - Phù hợp khi cần kiểm soát hoàn toàn

---

## 9. Xử lý sự cố

### Video không hiển thị (màn hình đen)

| Nguyên nhân                        | Giải pháp                                             |
|------------------------------------|--------------------------------------------------------|
| File chưa chia sẻ public           | Cài đặt quyền: "Bất kỳ ai có đường liên kết"          |
| File ID sai                        | Kiểm tra lại ID từ URL Drive                           |
| File bị xoá trên Drive             | Upload lại và cập nhật File ID mới                     |
| Trình duyệt chặn iframe           | Thử trình duyệt khác, tắt ad-blocker                  |
| Google Drive hạn chế lượt xem      | Video quá nhiều lượt xem → tạm bị giới hạn             |

### PDF không tải được

| Nguyên nhân                        | Giải pháp                                             |
|------------------------------------|--------------------------------------------------------|
| File chưa chia sẻ                  | Chia sẻ "Bất kỳ ai có đường liên kết"                 |
| File quá lớn để preview            | Drive chỉ preview PDF < 100 trang; nút tải vẫn hoạt động |

### Kiểm tra API hoạt động

```bash
# Health check
curl http://localhost/api/health

# Xem tất cả bài học
curl http://localhost/api/lessons/

# Xem 1 bài học cụ thể
curl http://localhost/api/lessons/1
```

### Kiểm tra nhanh video embed

Mở trực tiếp URL trong trình duyệt:
```
https://drive.google.com/file/d/YOUR_FILE_ID/preview
```

Nếu link trên hiển thị video → File ID đúng và quyền OK.
Nếu báo lỗi → Kiểm tra lại quyền chia sẻ.

---

## Tóm tắt Workflow thêm bài học mới

```
1. Upload video + PDF lên Google Drive
2. Chia sẻ "Bất kỳ ai có đường liên kết" → Người xem
3. Copy File IDs từ URL
4. POST /api/lessons/ với video_drive_id & pdf_drive_id
5. Set is_published: true khi sẵn sàng
6. Kiểm tra trên frontend: http://localhost/lessons/{id}
```
