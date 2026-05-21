# Hệ thống Thông báo (In-app Notifications)

Tài liệu này hướng dẫn vận hành tính năng **Thông báo** trên ĐGNL Mỗi Ngày.

## 1. Học viên sẽ thấy thông báo ở đâu?

- Khi học viên đã đăng nhập, trên thanh điều hướng (Navbar) sẽ có **biểu tượng chuông**.
- Nếu có thông báo chưa đọc sẽ hiện số (badge) như `1`, `2`, … hoặc `9+`.
- Bấm vào chuông để xem danh sách thông báo.

## 2. Các loại thông báo đang có

### 2.1. Thông báo Q&A (tự động)

Khi một câu hỏi trong Q&A có **câu trả lời mới**, hệ thống tự tạo thông báo cho **tác giả câu hỏi**.

- Nếu người trả lời là admin: tiêu đề sẽ là “**Admin đã trả lời câu hỏi của bạn**”.
- Nếu người trả lời là học viên/người dùng thường: tiêu đề sẽ là “**Câu hỏi của bạn đã có câu trả lời mới**”.
- Thông báo sẽ kèm link dẫn thẳng tới câu hỏi: `/hoi-dap/<id>`.

### 2.2. Thông báo Broadcast (admin gửi)

Admin có thể gửi thông báo tới:

- **Học viên đã đăng ký** (`target = enrolled`) — khuyến nghị dùng cho bài tập mới/lịch học.
- **Tất cả người dùng** (`target = all`) — dùng khi cần thông báo chung.

## 3. Cách admin gửi thông báo (UI)

1. Đăng nhập bằng tài khoản admin.
2. Vào trang `/admin`.
3. Chọn tab **Thông báo**.
4. Nhập:
   - **Tiêu đề** (bắt buộc)
   - **Nội dung** (khuyến nghị)
   - **Link** (tuỳ chọn)
   - **Gửi tới** (Học viên đã đăng ký / Tất cả người dùng)
5. Bấm **Gửi thông báo**.

Gợi ý dùng link nội bộ:

- Q&A: `/hoi-dap/123`
- Bài giảng: `/lessons/45`
- Nền tảng theo môn: `/nen-tang/toan`
- Luyện đề theo môn: `/luyen-de/toan`
- Kho tài liệu: `/kho-tai-lieu-mo`

## 4. API (dành cho debug / tích hợp)

Tất cả endpoints dưới đây nằm dưới prefix `/api/notifications`.

- `GET /api/notifications/?limit=12&offset=0`
  - Trả về `unread_count` và danh sách `items`.
- `PATCH /api/notifications/{id}/read`
  - Đánh dấu 1 thông báo là đã đọc.
- `POST /api/notifications/mark-all-read`
  - Đánh dấu tất cả thông báo là đã đọc.
- `POST /api/notifications/broadcast` (admin)
  - Body JSON:
    - `title` (string, bắt buộc)
    - `body` (string | null)
    - `url` (string | null)
    - `target` = `enrolled` | `all`

## 5. Dữ liệu & Migration

- Bảng mới: `notifications`
- Migration: `backend/alembic/versions/009_notifications.py`

## 6. Lưu ý vận hành

- Thông báo là **in-app**: học viên sẽ thấy khi truy cập website (không gửi email/SMS).
- Nếu bạn đang dùng Cloudflare và vừa triển khai thay đổi, đôi khi cần **Purge Cache** để UI/static mới áp dụng ngay.
