# 💳 Hệ thống thanh toán tự động SePay — ĐGNL Mỗi Ngày

Tài liệu này mô tả đầy đủ kiến trúc, cách vận hành, thông tin quan trọng và checklist bảo mật cho luồng thanh toán tự động bằng SePay.

---

## Mục lục

1. [Mục tiêu nghiệp vụ](#1-mục-tiêu-nghiệp-vụ)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [Cấu trúc dữ liệu](#3-cấu-trúc-dữ-liệu)
4. [Luồng vận hành end-to-end](#4-luồng-vận-hành-end-to-end)
5. [API đã triển khai](#5-api-đã-triển-khai)
6. [Biến môi trường quan trọng](#6-biến-môi-trường-quan-trọng)
7. [Cấu hình SePay webhook](#7-cấu-hình-sepay-webhook)
8. [Bảo mật theo chuẩn production](#8-bảo-mật-theo-chuẩn-production)
9. [Runbook vận hành hằng ngày](#9-runbook-vận-hành-hằng-ngày)
10. [Xử lý sự cố thường gặp](#10-xử-lý-sự-cố-thường-gặp)
11. [Checklist go-live](#11-checklist-go-live)

---

## 1. Mục tiêu nghiệp vụ

Hệ thống mới đáp ứng các yêu cầu sau:

- Tạo QR chuyển khoản tự động ngay trên trang đăng ký.
- Xác nhận giao dịch qua webhook từ SePay.
- Cho phép nhập email Google trước hoặc sau khi thanh toán.
- Cấp quyền học tự động trong database ngay khi giao dịch hợp lệ.
- Hiển thị link tham gia nhóm Zalo và video hướng dẫn sau khi thanh toán thành công.
- Luôn hiển thị kênh Zalo hỗ trợ sự cố.

---

## 2. Kiến trúc tổng thể

```text
Hoc vien
   |
   | (tao don + QR)
   v
Frontend /dang-ky (React)
   |
   | POST /api/payments/orders
   v
Backend FastAPI (payments router)
   |
   | luu payment_orders (pending)
   v
PostgreSQL

Hoc vien chuyen khoan qua QR
   |
   v
SePay doi soat giao dich
   |
   | POST /api/payments/sepay/webhook
   v
Backend FastAPI
   |
   | cap nhat payment_orders + users.is_enrolled = true
   v
Frontend poll GET /api/payments/orders/{order_code}
   |
   v
Hien link Zalo nhom + YouTube huong dan
```

---

## 3. Cấu trúc dữ liệu

### 3.1 Bảng `payment_orders`

Bảng mới được tạo bởi migration `003_sepay_payment_orders`.

Trường chính:

- `order_code` (unique): mã đơn dùng để đối soát.
- `transfer_content` (unique): nội dung chuyển khoản bắt buộc học viên nhập đúng.
- `status`: `pending | partial | paid_waiting_email | paid | expired | failed`.
- `google_email`: email Google dùng để cấp quyền.
- `expected_amount`, `paid_amount`: đối soát số tiền.
- `provider_transaction_id`: mã giao dịch từ SePay (idempotency).
- `provider_payload`: JSON payload webhook để audit.
- `paid_at`, `access_granted_at`: thời điểm xác nhận tiền và mở quyền học.

### 3.2 Liên kết với bảng `users`

- `payment_orders.user_id` tham chiếu `users.id` (nullable).
- Khi webhook xác nhận đủ tiền và có email hợp lệ:
  - tìm hoặc tạo user theo email,
  - set `users.is_enrolled = true`,
  - cập nhật `payment_orders.access_granted_at`.

---

## 4. Luồng vận hành end-to-end

### 4.1 Trước thanh toán

1. Học viên vào trang `/dang-ky`.
2. Nhập email Google (khuyến nghị) và tạo mã thanh toán.
3. Hệ thống sinh:
   - `order_code`,
   - `transfer_content`,
   - `qr_image_url` (VietQR động).
4. Frontend hiển thị QR và trạng thái `pending`.

### 4.2 Sau thanh toán (webhook)

1. SePay gọi webhook `POST /api/payments/sepay/webhook`.
2. Backend xác minh webhook secret.
3. Backend parse `content` và `amount` để xác định đơn.
4. Nếu `amount >= expected_amount`:
   - có email: cấp quyền ngay (`status=paid`),
   - chưa có email: `status=paid_waiting_email`.

### 4.3 Nhập email sau thanh toán

- Nếu học viên thanh toán trước nhưng chưa nhập email,
  frontend gọi `PATCH /api/payments/orders/{order_code}/email`.
- Backend cập nhật email và cấp quyền ngay nếu đơn đã trả tiền.

### 4.4 Trải nghiệm học viên

- Frontend polling trạng thái mỗi 6 giây.
- Khi `status=paid`, trang hiển thị:
  - link nhóm Zalo khóa học,
  - link video YouTube hướng dẫn sử dụng,
  - đồng bộ lại user profile để mở quyền học ngay.

---

## 5. API đã triển khai

Base path: `/api/payments`

### 5.1 Tạo đơn

- `POST /orders`
- Body:

```json
{
  "google_email": "student@gmail.com",
  "full_name": "Nguyen Van A"
}
```

- Trả về: mã đơn, QR URL, số tiền, nội dung chuyển khoản, trạng thái.

### 5.2 Lấy trạng thái đơn (frontend polling)

- `GET /orders/{order_code}`

### 5.3 Cập nhật email Google trước/sau thanh toán

- `PATCH /orders/{order_code}/email`
- Body:

```json
{
  "google_email": "student@gmail.com"
}
```

### 5.4 Webhook SePay

- `POST /sepay/webhook`
- Yêu cầu header secret theo `SEPAY_WEBHOOK_HEADER` hoặc `Authorization: Bearer <secret>`.

---

## 6. Biến môi trường quan trọng

Cấu hình trong file `.env`:

```env
PAYMENT_PROVIDER=sepay
PAYMENT_ORDER_PREFIX=DGNL
PAYMENT_ORDER_EXPIRY_MINUTES=60
COURSE_PRICE_VND=599000

SEPAY_WEBHOOK_HEADER=x-sepay-token
SEPAY_WEBHOOK_SECRET=CHANGE_ME_SEPAY_WEBHOOK_SECRET

BANK_NAME=TP BANK
BANK_BIN=970423
BANK_ACCOUNT_NUMBER=04351047435
BANK_ACCOUNT_NAME=NGUYEN HUY HOANG

COURSE_ZALO_GROUP_URL=https://zalo.me/g/replace-with-zalo-group
COURSE_YOUTUBE_GUIDE_URL=https://www.youtube.com/watch?v=replace-with-guide-video
SUPPORT_ZALO_URL=https://zalo.me/0355912940
```

Mức độ nhạy cảm:

- `SEPAY_WEBHOOK_SECRET`: 🔴 cực kỳ nhạy cảm, không commit.
- `BANK_ACCOUNT_NUMBER`: 🟡 công khai được cho học viên nhưng vẫn nên quản lý tập trung.
- `COURSE_ZALO_GROUP_URL`, `COURSE_YOUTUBE_GUIDE_URL`: 🟡 nội dung kinh doanh, không public trong repo nếu muốn kiểm soát.

Giải thích nhanh các biến thường bị nhầm:

- `BANK_BIN`: mã ngân hàng 6 chữ số theo chuẩn NAPAS/VietQR (ví dụ TPBank là `970423`). Hệ thống dùng mã này để tạo URL QR động.
- `SEPAY_WEBHOOK_HEADER`: tên HTTP header mà backend dùng để đọc secret webhook. Mặc định đang dùng `x-sepay-token`.
- `SEPAY_WEBHOOK_SECRET`: giá trị bí mật đi kèm trong header để xác thực request IPN từ SePay.

Bạn có thể thấy/cấu hình header webhook trong phần cài đặt Webhook/IPN trên SePay (nếu SePay cho phép đặt custom header). Nếu SePay dùng header cố định theo tài liệu của họ, hãy đặt `SEPAY_WEBHOOK_HEADER` đúng tên header đó.

---

## 7. Cấu hình SePay webhook

### 7.1 IPN là gì?

IPN (Instant Payment Notification) là cơ chế SePay chủ động gọi HTTP callback đến server của bạn khi phát hiện giao dịch vào tài khoản nhận tiền. Trong hệ thống này, IPN chính là request webhook SePay gửi vào endpoint backend để backend tự động đối soát và mở quyền học.

### 7.2 URL IPN production

Dùng endpoint:

```text
https://dgnlmoingay.com/api/payments/sepay/webhook
```

### 7.3 SePay gửi thông báo giao dịch thành công như thế nào?

Khi có giao dịch phù hợp, SePay sẽ gửi một request `POST` (JSON) đến URL IPN của bạn.

Thông thường request có cấu trúc như sau:

```http
POST /api/payments/sepay/webhook
Content-Type: application/json
x-sepay-token: <SEPAY_WEBHOOK_SECRET>
```

```json
{
   "content": "DK DGNL260420120000ABCD",
   "amount": 599000,
   "transactionId": "SPY_123456"
}
```

Ý nghĩa nhanh:

- `content`: nội dung chuyển khoản từ giao dịch ngân hàng (backend dùng để tách `order_code`).
- `amount`: số tiền thực nhận.
- `transactionId`/`referenceCode`: mã giao dịch từ phía SePay/ngân hàng.

Lưu ý: Tên field thực tế có thể khác giữa các cấu hình/provider. Backend hiện đã hỗ trợ nhiều biến thể field để tránh fail parsing.

### 7.4 Header bảo mật

Thiết lập tại SePay một header bí mật, ví dụ:

- Header: `x-sepay-token`
- Value: giống `SEPAY_WEBHOOK_SECRET` trong `.env`

### 7.5 Yêu cầu payload

Backend hỗ trợ nhiều dạng field phổ biến:

- Nội dung: `content`, `transferContent`, `description`, `remark`, `note`
- Số tiền: `amount`, `transferAmount`, `transfer_amount`, `value`, `creditAmount`
- Mã giao dịch: `transactionId`, `referenceCode`, `id`, `code`

Mục tiêu là chống fail khi SePay thay đổi nhẹ format.

### 7.6 Cấu hình IPN trên SePay (khuyến nghị)

1. Vào màn hình quản lý Webhook/IPN trong SePay.
2. Khai báo URL callback: `https://dgnlmoingay.com/api/payments/sepay/webhook`.
3. Chọn method `POST`, format `application/json` (nếu có tùy chọn).
4. Khai báo header bảo mật:
    - Name: `x-sepay-token` (hoặc header cố định theo SePay)
    - Value: trùng `SEPAY_WEBHOOK_SECRET` trong `.env`
5. Lưu cấu hình và bấm gửi test webhook (nếu SePay có nút test).
6. Kiểm tra log backend để xác nhận webhook đã vào đúng endpoint.

### 7.7 Tôi có thể test với domain https://dgnlmoingay.com không?

Có. Bạn nên test trực tiếp domain production để kiểm tra đầy đủ mạng thực tế.

Điều kiện để test thành công:

1. Domain public truy cập được qua HTTPS hợp lệ.
2. Nginx đang route `/api/payments/*` vào backend.
3. Container backend đang chạy và đã nhận biến `SEPAY_WEBHOOK_SECRET`.
4. Cloudflare/WAF không chặn request `POST` từ SePay.

Bạn có thể test theo 2 cách:

- Cách 1: dùng nút test webhook trong SePay (nếu có).
- Cách 2: gửi tay bằng curl:

```bash
curl -X POST https://dgnlmoingay.com/api/payments/sepay/webhook \
   -H "Content-Type: application/json" \
   -H "x-sepay-token: <SEPAY_WEBHOOK_SECRET>" \
   -d '{
      "content": "DK DGNL260420120000ABCD",
      "amount": 599000,
      "transactionId": "TXN_TEST_PROD_001"
   }'
```

### 7.8 Tôi có xem BANK_BIN và SEPAY_WEBHOOK_HEADER ở SePay không?

- `SEPAY_WEBHOOK_HEADER`: có thể xem/cấu hình ngay trong phần webhook của SePay nếu SePay hỗ trợ custom header; nếu không hỗ trợ, xem tài liệu SePay để biết header cố định họ gửi.
- `BANK_BIN`: thường là mã ngân hàng theo NAPAS/VietQR. Có thể tra từ danh sách ngân hàng VietQR/NAPAS; một số giao diện SePay cũng hiển thị mã này khi chọn ngân hàng nhận tiền.

Nguyên tắc thực tế: cấu hình `.env` phải bám đúng dữ liệu thật mà SePay đang gửi và đúng mã BIN của ngân hàng nhận tiền bạn đang dùng.

---

## 8. Bảo mật theo chuẩn production

Các điểm bảo mật đã áp dụng trong luồng thanh toán:

- Webhook bắt buộc secret và so sánh bằng `hmac.compare_digest` (chống timing attack).
- Dữ liệu đầu vào được validate bằng Pydantic (`EmailStr`, schema rõ ràng).
- Đối soát bằng `order_code` riêng cho từng đơn + `transfer_content` unique.
- Trạng thái thanh toán idempotent (nhận webhook lặp không mở quyền sai).
- Lưu payload webhook để audit điều tra sự cố.
- Không trả link nhóm học trước khi đơn đạt trạng thái `paid`.

Khuyến nghị bổ sung:

- Dùng secret dài >= 32 ký tự ngẫu nhiên.
- Giới hạn IP nguồn webhook nếu SePay có dải IP cố định.
- Thiết lập alert khi `status=partial` tăng đột biến.
- Backup DB hằng ngày vì trạng thái thanh toán là dữ liệu nghiệp vụ quan trọng.

---

## 9. Runbook vận hành hằng ngày

### 9.1 Deploy thay đổi

```bash
docker compose up --build -d
docker compose exec backend alembic upgrade head
docker compose logs -f backend
```

### 9.2 Kiểm tra nhanh sau deploy

1. Vào `/dang-ky`, tạo đơn thử.
2. Kiểm tra có hiển thị QR + `order_code`.
3. Gọi thử API status:

```bash
curl http://localhost/api/payments/orders/<ORDER_CODE>
```

4. Gửi thử webhook bằng secret đúng:

```bash
curl -X POST http://localhost/api/payments/sepay/webhook \
  -H "Content-Type: application/json" \
  -H "x-sepay-token: <SEPAY_WEBHOOK_SECRET>" \
  -d '{
    "content": "DK DGNL260420120000ABCD",
    "amount": 599000,
    "transactionId": "TXN_TEST_001"
  }'
```

### 9.3 Theo dõi dữ liệu thanh toán

```sql
SELECT order_code, google_email, status, expected_amount, paid_amount, paid_at, access_granted_at
FROM payment_orders
ORDER BY created_at DESC
LIMIT 50;
```

---

## 10. Xử lý sự cố thường gặp

### Tình huống A: Đã chuyển khoản nhưng vẫn `pending`

Kiểm tra:

1. SePay đã bắn webhook đúng URL chưa.
2. Header secret có khớp không.
3. Nội dung chuyển khoản có chứa đúng `order_code` không.
4. Số tiền có >= `COURSE_PRICE_VND` không.

### Tình huống B: `paid_waiting_email`

Nguyên nhân: chưa có email Google để cấp quyền.

Cách xử lý:

- Học viên nhập email ở form trên trang đăng ký.
- Hoặc admin cập nhật thủ công bằng API `PATCH /orders/{order_code}/email`.

### Tình huống C: Đã `paid` nhưng user vẫn không học được

Kiểm tra SQL:

```sql
SELECT email, is_enrolled FROM users WHERE email = 'student@gmail.com';
```

Nếu `is_enrolled=false`, xử lý nhanh:

```sql
UPDATE users SET is_enrolled = true WHERE email = 'student@gmail.com';
```

Sau đó học viên đăng xuất/đăng nhập lại hoặc refresh profile.

---

## 11. Checklist go-live

- [ ] Đã set `SEPAY_WEBHOOK_SECRET` mạnh và không để mặc định.
- [ ] SePay webhook trỏ đúng domain production.
- [ ] Đã chạy migration `003_sepay_payment_orders`.
- [ ] Đã cấu hình đúng tài khoản nhận tiền (`BANK_*`).
- [ ] Đã set link nhóm học `COURSE_ZALO_GROUP_URL`.
- [ ] Đã set video hướng dẫn `COURSE_YOUTUBE_GUIDE_URL`.
- [ ] Đã test end-to-end một giao dịch thật (hoặc sandbox nếu SePay hỗ trợ).
- [ ] Đã có kênh hỗ trợ sự cố `SUPPORT_ZALO_URL` hoạt động.

---

Nếu cần mở rộng giai đoạn sau:

1. Tạo trang admin giám sát đơn thanh toán.
2. Gửi email tự động khi `status=paid`.
3. Ký HMAC payload theo chuẩn riêng của SePay (nếu provider hỗ trợ).
