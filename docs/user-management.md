# 👩‍🎓 Quản lý học viên & Lịch sử thi — Admin Guide

> Tài liệu này mô tả các tính năng **mới** được bổ sung cho admin dashboard:
> - Thêm học viên bằng email trước khi họ đăng nhập Google
> - Chỉnh sửa thông tin đăng ký (năm nhập học, loại khóa học, trạng thái đăng ký)
> - Xem / xóa học viên
> - Lưu & xem lại bài thi thực chiến của từng học viên

---

## 1. Luồng thêm học viên bằng email

Trước đây, một tài khoản chỉ được tạo khi người dùng tự **đăng nhập Google** lần đầu. Nay admin có thể **pre-register** học viên trước khi họ truy cập website lần nào.

### 1.1. Cách làm trên UI

1. Vào **`/admin`** → tab **Học viên**.
2. Nhấn nút **“Thêm học viên”** (góc trên bên phải của thanh tìm kiếm).
3. Điền form:
   | Trường | Bắt buộc | Mô tả |
   |--------|----------|--------|
   | **Email** | ✅ | Email Google mà học viên sẽ dùng để đăng nhập |
   | Họ tên | ❌ | Nếu bỏ trống, sẽ tự lấy từ Google khi học viên đăng nhập lần đầu |
   | Năm nhập học | ❌ | VD: 2026 |
   | Loại khóa học | ❌ | Tự luyện / Cơ bản / Nâng cao |
   | Cấp quyền truy cập ngay | ✅ mặc định bật | Tương đương `is_enrolled = true` |
   | Là quản trị viên | ❌ | Đánh dấu tài khoản này là admin ngay từ đầu |
4. Nhấn **Tạo tài khoản**.

Trong bảng danh sách, tài khoản mới sẽ xuất hiện với badge vàng **“Chờ đăng nhập”** — nghĩa là DB đã có hàng cho email này nhưng `google_id` vẫn `NULL`.

### 1.2. Điều gì xảy ra khi học viên đăng nhập lần đầu?

Backend (`POST /api/auth/google`) sẽ:

1. Tìm `users` theo `email` — gặp bản ghi admin đã tạo trước đó.
2. Điền `google_id`, `picture`, cập nhật `last_login`.
3. **Không ghi đè** các trường admin đã nhập (`is_enrolled`, `enrollment_year`, `course_type`, `is_admin`).
4. `name` chỉ được ghi đè nếu admin để trống (vì lúc đó nó bằng phần trước `@` của email).

Badge “Chờ đăng nhập” sẽ tự biến mất sau lần login đầu tiên.

### 1.3. Idempotent

Nếu admin nhấn “Tạo tài khoản” với một email đã tồn tại, API **không báo lỗi** mà cập nhật các trường được nhập vào bản ghi hiện tại. Dùng chính form này để “nâng cấp” một học viên lên admin cũng được.

---

## 2. Chỉnh sửa thông tin học viên

- Trong bảng danh sách, mỗi hàng có icon 📝 (**Chỉnh sửa**).
- Modal mở ra cho phép sửa: **Họ tên**, **Năm nhập học**, **Loại khóa học**, **Đã đăng ký**.
- Email và `google_id` **không** sửa được (đây là khóa nhận diện).
- Dùng icon 🗑️ để **xóa** tài khoản (cascade xóa luôn `user_progress` và `exam_attempts`).

API tương ứng:

| Method | Path | Body |
|-------|------|------|
| `PATCH` | `/api/auth/users/{id}` | `{name?, enrollment_year?, course_type?, is_enrolled?, is_admin?}` |
| `DELETE` | `/api/auth/users/{id}` | — |

---

## 3. Bộ lọc trạng thái

Trên toolbar của tab Học viên:

- **Tất cả** — mọi user
- **Đã ĐK** — `is_enrolled = true`
- **Chưa ĐK** — `is_enrolled = false`
- **Chờ đăng nhập** 🆕 — admin đã pre-register nhưng user chưa login Google lần nào
- **Admin** — `is_admin = true`

---

## 4. Lưu & xem lại bài thi thực chiến

### 4.1. Lưu gì?

Mỗi lần học viên **đã đăng ký** nộp bài thi ở `/thuc-chien/:examId`, frontend sẽ POST lên `/api/exams/attempts` với payload:

```json
{
  "exam_id": "vactdot1-2026",
  "exam_title": "Đề VACT Đợt 1 — 2026",
  "score": 960,
  "max_score": 1200,
  "correct_count": 96,
  "wrong_count": 20,
  "unanswered_count": 4,
  "total_questions": 120,
  "time_spent_seconds": 8230,
  "answers": { "0": "A", "1": "C", "2": "B", ... },
  "meta": { "bySubject": { "Toán": { "total": 30, "correct": 25 }, ... } }
}
```

Trong đó `answers` là map **từ chỉ số câu hỏi (0-based) sang đáp án được chọn** (A|B|C|D). Điều này cho phép sau này ta dựng lại toàn bộ bài thi và highlight từng câu đúng / sai.

### 4.2. Ai được lưu?

| Vai trò | Hành vi |
|--------|---------|
| Khách chưa login | Có thể thi đề **Miễn phí** nhưng kết quả **không** lưu |
| Đăng nhập nhưng chưa đăng ký | Giống khách — banner gợi ý đăng ký |
| Học viên đã đăng ký (`is_enrolled`) | Mỗi lần nộp bài đều được lưu; có thể xem lại |
| Admin | Giống học viên đã đăng ký + xem attempt của **bất kỳ** user nào |

Backend bảo vệ bằng dependency `require_enrolled` ở endpoint `POST /api/exams/attempts`.

### 4.3. Học viên xem lại ở đâu?

Khi mở bất kỳ đề thi nào ở `/thuc-chien/:examId`, học viên đã đăng ký sẽ thấy **banner “Lịch sử làm bài của bạn”** ở phía trên setup screen, liệt kê tối đa 10 lần gần nhất kèm điểm, tỉ lệ phần trăm, thời gian, và số câu đúng/sai/trống.

Sau khi nộp 1 bài mới, banner sẽ tự refresh (qua callback `onAttemptSaved`).

### 4.4. Admin xem lại học viên nào?

- Vào `/admin` → tab **Học viên**.
- Nhấn icon 📄 **Lịch sử thi** trên hàng của học viên.
- Modal hiện toàn bộ lần thi với điểm, số câu đúng/sai/trống, thời gian và timestamp.

API tương ứng:

| Method | Path | Quyền |
|-------|------|------|
| `POST` | `/api/exams/attempts` | enrolled |
| `GET`  | `/api/exams/attempts/me` (optional `?exam_id=`) | auth (returns `[]` cho non-enrolled) |
| `GET`  | `/api/exams/attempts/{attempt_id}` | owner hoặc admin (trả về `answers` full để re-play) |
| `GET`  | `/api/exams/attempts/user/{user_id}` | admin only |

### 4.5. Schema DB — `exam_attempts`

```
id                 PK
user_id            FK → users.id  (ON DELETE CASCADE)
exam_id            VARCHAR(100)   — khớp với id trong /public/exams/index.json
exam_title         VARCHAR(255)
score / max_score  INT
correct_count / wrong_count / unanswered_count / total_questions  INT
time_spent_seconds INT
answers            JSON           — {"<q_index>": "A|B|C|D"}
meta               JSON           — breakdown tùy ý (per-subject, v.v.)
submitted_at       TIMESTAMP
```

---

## 5. Thay đổi về hiển thị PDF

Component `PDFMaterial.jsx` đã **bỏ iframe preview** của Google Drive. Lý do:

- Cửa sổ preview quá nhỏ, không chuyên nghiệp trên mobile
- Tải chậm do Drive chèn chrome của Google
- Không responsive tốt với dark mode

Giờ component chỉ hiển thị **card + 2 nút**: “Mở trong Drive” (tab mới) và “Tải xuống”. Trải nghiệm xem PDF diễn ra ở trình duyệt thật / trình đọc PDF của máy, rộng rãi hơn nhiều.

---

## 6. Migration DB

Bản ghi migration **`002_attempts_and_preregister`** thực hiện:

1. `ALTER users.google_id DROP NOT NULL` — cho phép pre-register.
2. `CREATE TABLE exam_attempts` (xem schema ở mục 4.5).

Chạy trên VPS / local:

```bash
docker compose exec backend alembic upgrade head
```

Để rollback (xóa attempts + bắt buộc lại `google_id`):

```bash
docker compose exec backend alembic downgrade -1
```

> ⚠️ Downgrade sẽ fail nếu đang tồn tại user không có `google_id`. Xóa hoặc cập nhật những bản ghi đó trước.

---

## 7. Kiểm thử nhanh

```bash
# 1. Build + migrate
docker compose up --build -d
docker compose exec backend alembic upgrade head

# 2. Tạo admin đầu tiên (sau khi admin đó login lần đầu bằng Google)
docker compose exec db psql -U dgnl_user -d dgnl_db -c \
  "UPDATE users SET is_admin=true, is_enrolled=true WHERE email='admin@example.com';"

# 3. Từ UI admin: Thêm học viên hocvien1@gmail.com → Cấp quyền ngay
# 4. Hocvien1 login Google → tự gắn google_id vào record đã có
# 5. Hocvien1 thi đề vactdot1-2026 → POST /api/exams/attempts
# 6. Hocvien1 vào lại đề đó → thấy banner Lịch sử làm bài
# 7. Admin vào /admin → icon 📄 trên hàng hocvien1 → thấy attempt vừa rồi
```

---

## 8. Ý tưởng mở rộng

- [ ] Trang **“Bài thi của tôi”** (`/lich-su-thi`) tổng hợp attempt của mọi đề
- [ ] Detail view: nhấn 1 attempt → replay toàn bộ bài, hiển thị từng câu đúng/sai dựa trên `answers` đã lưu
- [ ] Export CSV danh sách học viên từ admin panel
- [ ] Bulk import học viên (nhập nhiều email / upload CSV)
- [ ] Gửi email chào mừng tự động khi pre-register
- [ ] Biểu đồ điểm theo thời gian cho mỗi đề (dùng dữ liệu có sẵn trong `exam_attempts`)
