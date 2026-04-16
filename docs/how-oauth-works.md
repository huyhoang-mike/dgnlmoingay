# 🔐 Google OAuth 2.0 — Giải thích chi tiết

> Tài liệu này giải thích cách Google OAuth hoạt động trong ứng dụng **ĐGNL Mỗi Ngày**, các khái niệm quan trọng, mức độ an toàn, và cách ứng dụng lưu trữ + tương tác với người dùng.

---

## 📖 OAuth 2.0 là gì?

**OAuth 2.0** (Open Authorization) là một **tiêu chuẩn giao thức ủy quyền** (authorization protocol) cho phép ứng dụng bên thứ ba truy cập tài nguyên của người dùng **mà không cần biết mật khẩu**.

Ví dụ đời thường:
> Bạn muốn cho người giao hàng vào tòa nhà lấy đồ. Thay vì đưa chìa khóa nhà, bạn nhờ bảo vệ cấp **thẻ tạm thời** chỉ cho phép vào sảnh. → Đó chính là OAuth.

### Các vai trò trong OAuth 2.0

| Vai trò | Trong ứng dụng ĐGNL | Giải thích |
|---------|---------------------|------------|
| **Resource Owner** | Người dùng (bạn) | Người sở hữu tài khoản Google |
| **Client** | Ứng dụng ĐGNL Mỗi Ngày | Ứng dụng xin phép truy cập |
| **Authorization Server** | Google OAuth Server | Google xác thực và cấp token |
| **Resource Server** | Google APIs | Nơi lưu thông tin profile |

### OpenID Connect (OIDC)

Ứng dụng ĐGNL dùng **OpenID Connect** — một lớp xác thực (authentication) xây dựng trên nền OAuth 2.0. OIDC bổ sung thêm **ID Token** (JWT) chứa thông tin người dùng:
- Email
- Tên hiển thị
- Ảnh đại diện
- Google User ID

---

## 🔄 Luồng hoạt động trong ứng dụng ĐGNL

### Sơ đồ tổng quát

```
┌──────────────┐     1. Click "Đăng nhập"     ┌──────────────────┐
│   Frontend   │ ────────────────────────────→ │  Google OAuth    │
│  (React)     │                               │  Consent Screen  │
│              │     2. Chọn tài khoản Google  │                  │
│              │ ←──────────────────────────── │  (accounts.google │
│              │        (ID Token)             │   .com)           │
│              │                               └──────────────────┘
│              │     3. Gửi ID Token
│              │ ────────────────────────────→ ┌──────────────────┐
│              │                               │   Backend        │
│              │     4. Nhận JWT + User Info   │   (FastAPI)      │
│              │ ←──────────────────────────── │                  │
└──────────────┘                               │  5. Xác minh     │
                                               │     token với    │
                                               │     Google       │
                                               │  6. Tạo/cập nhật │
                                               │     user trong   │
                                               │     PostgreSQL   │
                                               │  7. Tạo JWT      │
                                               └──────────────────┘
```

### Chi tiết từng bước

#### Bước 1 — Người dùng click "Đăng nhập bằng Google"
- Frontend hiển thị nút Google Sign-In (thư viện `@react-oauth/google`)
- Nút này được cấu hình với **Google Client ID** — một mã định danh công khai cho ứng dụng

#### Bước 2 — Google hiển thị Consent Screen
- Google mở popup để người dùng **chọn tài khoản** và **đồng ý chia sẻ** thông tin
- Thông tin được chia sẻ: email, tên, ảnh đại diện (chỉ vậy thôi!)
- **Google KHÔNG chia sẻ mật khẩu** với ứng dụng

#### Bước 3 — Google trả về ID Token cho Frontend
- Đây là một chuỗi JWT (JSON Web Token) được **Google ký số** (digitally signed)
- Chứa: email, name, picture, Google User ID, thời gian hết hạn
- Frontend **không giải mã** token này — chỉ chuyển tiếp cho backend

```
File: frontend/src/contexts/AuthContext.jsx
  → login(credential) gọi API: POST /api/auth/google { credential: "eyJhbGciOi..." }
```

#### Bước 4 — Backend xác minh ID Token với Google
- Backend dùng thư viện `google-auth` để **xác minh chữ ký số** của token
- Google's public keys được dùng để verify — đảm bảo token thật sự đến từ Google
- Nếu token giả hoặc hết hạn → trả lỗi 401

```python
# File: backend/app/routers/auth.py
idinfo = id_token.verify_oauth2_token(
    data.credential,          # Token từ frontend
    requests.Request(),       # HTTP transport
    settings.GOOGLE_CLIENT_ID # Client ID để verify audience
)
```

#### Bước 5 — Backend tạo/cập nhật User trong DB
- Lấy email, name, picture từ token đã verify
- Tìm user trong PostgreSQL theo email
- **Lần đầu đăng nhập**: Tạo user mới (`is_enrolled=False`, `is_admin=False`)
- **Đăng nhập lại**: Cập nhật name, picture, last_login

```python
# Không bao giờ lưu mật khẩu — chỉ lưu thông tin profile
user = User(
    email="student@gmail.com",
    name="Nguyễn Văn A",
    picture="https://lh3.googleusercontent.com/...",
    google_id="1234567890",
    is_enrolled=False,  # Admin cấp sau
    is_admin=False,
)
```

#### Bước 6 — Backend tạo JWT của riêng ứng dụng
- Tạo JWT mới, ký bằng **SECRET_KEY** riêng của ứng dụng
- JWT này **khác với** Google ID Token — nó là token nội bộ
- Chứa: email, user_id, thời gian hết hạn (60 phút mặc định)

```python
token = create_access_token(data={"sub": user.email, "user_id": user.id})
```

#### Bước 7 — Frontend lưu JWT và sử dụng
- JWT được lưu trong `localStorage` dưới key `dgnl-token`
- Mỗi API request gắn JWT vào header: `Authorization: Bearer <token>`
- Backend kiểm tra JWT mỗi request để xác định ai đang gọi API

---

## 🛡️ Tài khoản của bạn có an toàn không?

### ✅ CÓ — Rất an toàn. Lý do:

| Yếu tố | Giải thích |
|---------|------------|
| **Không lưu mật khẩu** | Ứng dụng **không bao giờ** nhận hoặc lưu mật khẩu Google của bạn |
| **Chỉ đọc thông tin công khai** | Chỉ lấy: email, tên, ảnh đại diện — không truy cập Gmail, Drive, v.v. |
| **Token có thời hạn** | Google ID Token hết hạn sau ~1 giờ; JWT ứng dụng hết hạn sau 60 phút |
| **Xác minh phía server** | Token được verify bằng Google's public keys — không thể giả mạo |
| **Không lưu token Google** | Backend chỉ verify rồi bỏ; chỉ giữ JWT nội bộ |
| **Bạn có thể thu hồi** | Vào [Google Account → Security → Third-party apps](https://myaccount.google.com/permissions) để gỡ quyền bất kỳ lúc nào |

### ⚠️ Những điều cần lưu ý

1. **SECRET_KEY phải bảo mật**: Đây là chìa khóa ký JWT. Nếu lộ, kẻ xấu có thể tạo token giả. → Dùng key dài, ngẫu nhiên trong `.env`
2. **HTTPS cho production**: Khi deploy, **bắt buộc** dùng HTTPS để token không bị đánh cắp khi truyền qua mạng
3. **Google Client ID + Secret**: Client ID là công khai (safe), nhưng Client Secret (nếu dùng) phải giữ kín
4. **localStorage có rủi ro XSS**: Nếu website bị XSS attack, token có thể bị đọc. → Đảm bảo sanitize tất cả input

### So sánh với đăng nhập bằng mật khẩu truyền thống

| | Google OAuth | Mật khẩu truyền thống |
|---|---|---|
| Lưu mật khẩu trong DB? | ❌ Không | ✅ Có (dù hashed) |
| Rủi ro lộ mật khẩu? | ❌ Không có mật khẩu để lộ | ⚠️ Có thể bị lộ nếu DB bị hack |
| Brute-force attack? | ❌ Không thể | ⚠️ Có thể nếu rate-limit yếu |
| Phishing? | 🟡 Ít hơn (Google có bảo vệ) | ⚠️ Dễ bị lừa nhập mật khẩu |
| 2FA? | ✅ Kế thừa 2FA của Google | ⚠️ Phải tự implement |

---

## 💾 Cách ứng dụng lưu người dùng

### Database Schema (bảng `users`)

```
┌─────────────────────────────────────────────────────────┐
│ users                                                    │
├──────────────┬──────────┬───────────────────────────────┤
│ Column       │ Type     │ Mô tả                         │
├──────────────┼──────────┼───────────────────────────────┤
│ id           │ int (PK) │ Auto-increment                │
│ email        │ varchar  │ Email Google (unique, indexed) │
│ name         │ varchar  │ Tên hiển thị từ Google        │
│ picture      │ varchar  │ URL ảnh đại diện              │
│ google_id    │ varchar  │ Google User ID (unique)       │
│ is_enrolled  │ boolean  │ Đã đăng ký khóa học?          │
│ is_admin     │ boolean  │ Có quyền admin?               │
│ created_at   │ datetime │ Lần đầu đăng nhập             │
│ last_login   │ datetime │ Lần đăng nhập gần nhất        │
└──────────────┴──────────┴───────────────────────────────┘
```

### Dữ liệu KHÔNG được lưu
- ❌ Mật khẩu Google
- ❌ Access token/refresh token của Google
- ❌ Dữ liệu cá nhân khác (contacts, calendar, drive...)

### 4 cấp độ quyền truy cập

```
Khách (Guest)
  │  ↓ Đăng nhập Google
Đã đăng nhập (is_enrolled=false, is_admin=false)
  │  ↓ Admin cấp quyền qua Admin Panel
Học viên (is_enrolled=true)
  │  ↓ Admin cấp quyền admin
Quản trị viên (is_admin=true)
```

| Cấp độ | Xem Landing | Học thử | Nội dung khóa | Đề thực chiến | Admin Panel |
|--------|-------------|---------|----------------|----------------|-------------|
| Khách  | ✅ | ✅ | ❌ (khóa) | Chỉ đề miễn phí | ❌ |
| Đã đăng nhập | ✅ | ✅ | ❌ (khóa) | Chỉ đề miễn phí | ❌ |
| Học viên | ✅ | ✅ | ✅ | ✅ Tất cả | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ Tất cả | ✅ |

---

## 🔗 Tương tác giữa ứng dụng và Google OAuth

### Những gì ứng dụng gửi cho Google
- **Google Client ID** (công khai, baked vào frontend)
- **Redirect URI** (URL callback sau khi đăng nhập)

### Những gì Google trả về
- **ID Token** (JWT chứa email, name, picture)
- Token này **chỉ dùng 1 lần** để verify, không lưu lại

### Những gì ứng dụng tự quản lý
- **JWT nội bộ** — token riêng của ĐGNL, ký bằng SECRET_KEY
- **User record** trong PostgreSQL — chỉ profile công khai
- **Enrollment status** — admin quản lý qua Admin Panel
- **Exam access settings** — admin quản lý qua Admin Panel

### Khi nào ứng dụng liên hệ Google?
1. **Khi user click đăng nhập** → Google popup (frontend ↔ Google)
2. **Khi backend verify token** → Gọi Google's public key endpoint (1 lần)
3. **Sau đó**: Không liên hệ Google nữa — chỉ dùng JWT nội bộ

---

## 🔑 Các khái niệm quan trọng

### JWT (JSON Web Token)
- Chuỗi mã hóa gồm 3 phần: **Header.Payload.Signature**
- Header: Thuật toán mã hóa (HS256)
- Payload: Dữ liệu (email, user_id, exp)
- Signature: Chữ ký số bằng SECRET_KEY
- Ai có SECRET_KEY mới tạo/verify được token hợp lệ

### ID Token vs Access Token
- **ID Token** (từ Google): Chứa thông tin người dùng, dùng để xác thực
- **Access Token** (JWT nội bộ): Token ứng dụng tự tạo, dùng cho API calls
- Ứng dụng ĐGNL dùng **ID Token flow** — đơn giản, phù hợp cho web app

### Client ID vs Client Secret
- **Client ID**: Mã công khai, nhúng trong frontend code — **an toàn**
- **Client Secret**: Mã bí mật, chỉ dùng ở backend — **ĐGNL không cần dùng** vì sử dụng implicit flow

### Consent Screen
- Màn hình Google hiển thị khi user đăng nhập lần đầu
- Liệt kê quyền mà ứng dụng xin (email, profile)
- User phải **đồng ý** trước khi tiếp tục
- Có thể thu hồi bất kỳ lúc nào tại Google Account Settings

---

## 📋 Tóm tắt

1. **Google OAuth = đăng nhập an toàn** — không cần mật khẩu, kế thừa bảo mật của Google
2. **Ứng dụng chỉ biết email + tên + ảnh** — không truy cập dữ liệu Google khác
3. **Token có thời hạn** — hết hạn tự động, không lưu vĩnh viễn
4. **Bạn có toàn quyền kiểm soát** — thu hồi quyền bất kỳ lúc nào qua Google Account
5. **Backend verify server-side** — token không thể giả mạo
