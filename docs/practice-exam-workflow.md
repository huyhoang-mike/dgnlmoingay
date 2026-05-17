# Quy Trinh Cap Nhat De Luyen De Va Tai Lieu

Tài liệu này mô tả cách đưa một đề luyện đề mới lên website sau khi đã có các file JSON bài giải hoặc đề thi thử.

## 1. Hieu dung ve `key`

Trong trang `Luyện đề`, mỗi mục như `vact_mh_2026` là một mã định danh nội bộ để gom các bài giải cùng một đề vào đúng nhóm.

- `vact_mh_2026` không phải là tên hiển thị.
- Đây là slug dùng ở URL và ở trường `subject` của bài học trong backend.
- Mỗi đề có thể gồm nhiều bài học con, ví dụ một video cho từng môn hoặc từng phần giải.

## 2. Cach them mot de luyen de moi

### Bước 1: Thêm mục hiển thị trong `frontend/src/pages/Practice.jsx`

Thêm một item mới vào đúng nhóm đề:

```jsx
{
  key: 'vact_mh_2027',
  name: 'Đề minh họa ĐHQG 2027',
  hasVideo: true,
}
```

- `key` phải khớp với `subject` của các bài học bài giải.
- Nếu đề đó không có video, đặt `hasVideo: false` để card hiển thị gọn hơn.

### Truong hop dac biet: Them "Sach Luyen De" (chi PDF)

Muc "Sach Luyen De" da duoc cau hinh san voi:

- `key`: `sach_luyen_de`
- URL: `/luyen-de/sach_luyen_de`

Khi them noi dung cho muc nay, chi can tao lesson voi `category = luyende` va `subject = sach_luyen_de`.
Khong can video. Ban co 2 truong hop:

- Chi co sach: chi can `pdf_drive_id`.
- Co kem dap an: them `answer_pdf_drive_id`.

Vi du payload:

```json
{
  "title": "Sách Luyện Đề - Chuyên đề Đọc hiểu 01",
  "description": "Bộ bài tập PDF có đáp án chi tiết",
  "order": 1,
  "category": "luyende",
  "subject": "sach_luyen_de",
  "video_drive_id": null,
  "pdf_drive_id": "GOOGLE_DRIVE_PDF_ID",
  "answer_pdf_drive_id": "GOOGLE_DRIVE_ANSWER_PDF_ID",
  "content": "Huong dan hoc va ghi chu quan trong...",
  "is_published": true,
  "is_free": false
}
```

Checklist nhanh cho Sach Luyen De:

- Upload file PDF len Google Drive.
- Chia se file voi quyen "Bất kỳ ai có đường liên kết" -> "Người xem".
- Copy file ID va gan vao `pdf_drive_id`.
- Neu co file dap an rieng, gan them vao `answer_pdf_drive_id`.
- Dam bao `category = luyende`, `subject = sach_luyen_de`.
- Bat `is_published = true` de hien thi tren website.

### Bước 2: Tạo các bài học con cho đề đó

Mỗi video bài giải hoặc mỗi phần tài liệu nên được tạo thành một lesson riêng trong backend.

Ví dụ payload tạo bài học:

```json
{
  "title": "V-ACT 2027 - Tiếng Việt",
  "description": "Phần giải chi tiết môn Tiếng Việt",
  "order": 1,
  "category": "luyende",
  "subject": "vact_mh_2027",
  "video_drive_id": "GOOGLE_DRIVE_VIDEO_ID",
  "pdf_drive_id": "GOOGLE_DRIVE_PDF_ID",
  "content": "Nội dung giải thích ngắn gọn...",
  "is_published": true,
  "is_free": false
}
```

Lưu ý:
- `category` phải là `luyende`.
- `subject` phải là đúng `key` của đề.
- Bạn có thể tạo nhiều lesson cho cùng một `subject` nếu đề được chia thành nhiều video/môn.

### Bước 3: Để trống video nếu không có video giải

Nếu một bài chỉ có tài liệu PDF, chỉ cần để:

```json
{
  "video_drive_id": null,
  "pdf_drive_id": "GOOGLE_DRIVE_PDF_ID"
}
```

Neu co file dap an di kem, them truong:

```json
{
  "answer_pdf_drive_id": "GOOGLE_DRIVE_ANSWER_PDF_ID"
}
```

Sau khi cập nhật, trang bài học sẽ tự ẩn khối video và ưu tiên hiển thị PDF Preview iframe ở phần đầu trang.

### Bước 4: Cập nhật dữ liệu trên database

Bạn có 3 cách:

- Dùng trang admin để tạo/cập nhật lesson.
- Gọi API `POST /api/lessons/` hoặc `PUT /api/lessons/{lesson_id}`.
- Import hàng loạt bằng CSV/XLSX qua `POST /api/lessons/import`.

## 3. Cach them mot de thi thu JSON moi

Nếu bạn muốn thêm đề trong phần `Luyện đề Thực chiến`, làm như sau:

### Bước 1: Thêm file JSON vào `frontend/public/exams/`

Ví dụ:

- `frontend/public/exams/vactdot2-2026.json`

### Bước 2: Đăng ký file đó trong `frontend/public/exams/index.json`

Thêm một entry mới:

```json
{
  "id": "vactdot2-2026",
  "title": "VACT Đợt 2 — 2026",
  "description": "Đề thi chính thức V-ACT Đợt 2 năm 2026 — ĐHQG TP.HCM",
  "file": "/exams/vactdot2-2026.json",
  "totalQuestions": 120,
  "timeMinutes": 150,
  "maxScore": 1200,
  "pointsPerQuestion": 10,
  "isFree": false,
  "tags": ["V-ACT", "2026", "Đợt 2", "Chính thức"],
  "sections": {
    "Tiếng Việt": { "count": 25, "label": "Sử dụng Ngôn ngữ" },
    "Tiếng Anh": { "count": 25, "label": "Sử dụng Ngôn ngữ" },
    "Toán": { "count": 30, "label": "Toán học" },
    "Tư duy khoa học": { "count": 40, "label": "Tư duy Khoa học" }
  }
}
```

### Bước 3: Kiểm tra quyền hiển thị

- `RealPractice.jsx` đọc `index.json` để dựng danh sách đề.
- Backend `exam_settings` cho phép admin bật/tắt `is_free` và `is_published` từng đề.
- Nếu `is_published = false`, đề sẽ bị ẩn khỏi danh sách.

### Bước 4: Cập nhật backend settings nếu cần

Trong trang admin, vào mục quản lý đề thi và chỉnh:

- `is_free`: cho phép ai vào làm
- `is_published`: có hiển thị công khai hay không

## 4. Khi nao can PDF Preview iframe

- Có video giải: dùng layout bình thường, PDF nằm ở cột phụ.
- Không có video: trang lesson sẽ tự ẩn khối video và đẩy PDF lên preview lớn ngay đầu trang.
- Cách này phù hợp cho các bài giải chỉ có tài liệu hoặc bài viết, giúp layout gọn hơn.

## 5. Checklist nhanh

- Thêm item vào `Practice.jsx` nếu muốn hiện trên trang luyện đề.
- Tạo lesson với `category = luyende` và `subject = key`.
- Thêm `video_drive_id` nếu có video.
- Thêm `pdf_drive_id` nếu có tài liệu.
- Thêm `answer_pdf_drive_id` nếu có file đáp án riêng.
- Đánh dấu `is_published = true` khi sẵn sàng xuất bản.
- Với đề thi thử JSON, thêm file vào `public/exams/` và đăng ký trong `index.json`.
