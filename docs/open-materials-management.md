# Quản lý Kho tài liệu mở

Kho tài liệu mở giúp website có thêm nội dung SEO miễn phí, đồng thời tạo phễu chuyển đổi sang khóa học qua quyền lợi học viên: truy cập thư mục Drive đầy đủ, đóng góp được ưu tiên và tài liệu được curator bởi admin.

## Kiến trúc lưu trữ

| Thành phần | Nơi lưu | Mục đích |
|---|---|---|
| Catalog công khai | PostgreSQL, bảng `open_materials` | Metadata SEO: tiêu đề, mô tả, môn, tag, link Drive |
| File đã duyệt | Google Drive | Lưu PDF/tài liệu công khai miễn phí, dễ chia sẻ và backup |
| File người dùng upload | VPS volume `/app/uploads/materials` | Lưu tạm để admin kiểm tra trước khi công khai |
| Trạng thái đóng góp | PostgreSQL, bảng `material_submissions` | Theo dõi pending/approved/rejected, ghi chú admin, ưu tiên học viên |

Luồng này hạn chế chi phí vì file công khai lớn nằm trên Google Drive, còn VPS chỉ giữ file đang chờ duyệt hoặc cần đối chiếu.

## API chính

| Endpoint | Quyền | Mục đích |
|---|---|---|
| `GET /api/open-materials/materials` | Public | Danh sách tài liệu đã publish |
| `POST /api/open-materials/materials` | Admin | Tạo tài liệu catalog từ Google Drive URL |
| `POST /api/open-materials/materials/{id}/download` | Public | Tăng bộ đếm trước khi mở Drive |
| `POST /api/open-materials/submissions/form` | Đăng nhập | Gửi PDF/ảnh chờ duyệt |
| `GET /api/open-materials/submissions/me` | Đăng nhập | Xem đóng góp của chính mình |
| `GET /api/open-materials/submissions` | Admin | Xem hàng chờ duyệt |
| `PATCH /api/open-materials/submissions/{id}/review` | Admin | Approve/reject và tùy chọn publish vào catalog |
| `DELETE /api/open-materials/submissions/{id}` | Admin | Xóa submission (đã review xong / spam) |
| `PATCH /api/open-materials/materials/{id}` | Admin | Cập nhật metadata, ẩn/hiện, đánh dấu nổi bật |
| `DELETE /api/open-materials/materials/{id}` | Admin | Gỡ tài liệu khỏi catalog |

## Quy trình vận hành đề xuất

1. Người dùng đăng nhập Google và gửi tài liệu tại `/kho-tai-lieu-mo`.
2. Hệ thống lưu file vào `/uploads/materials/YYYY/MM/...` và tạo `material_submissions.status = pending`.
3. Nếu người gửi là học viên hoặc admin, submission được gắn `is_priority = true`.
4. Admin tải file chờ duyệt, kiểm tra bản quyền/nội dung/chất lượng.
5. Nếu đạt:
   - Upload file đã chuẩn hóa lên Google Drive thư mục công khai.
   - Gọi API review với `status = approved`, `publish_to_catalog = true`, `drive_url = <link Drive>`.
6. Nếu chưa đạt: review với `status = rejected` và ghi `admin_notes` để người gửi chỉnh sửa.

## Checklist bản quyền trước khi publish

- Tài liệu tự biên soạn hoặc có quyền chia sẻ công khai.
- Nếu là tài liệu tổng hợp, phải ghi rõ nguồn và không copy nguyên văn nội dung có bản quyền thương mại.
- Không publish sách scan, khóa học trả phí, đề/tài liệu có watermark không thuộc quyền chia sẻ.
- Với tài liệu bên thứ ba chưa rõ quyền, chỉ dùng để tham khảo nội bộ khi review; không đưa vào Drive công khai.
- Ưu tiên publish bản đã chỉnh sửa/biên soạn lại bởi ĐGNL Mỗi Ngày với ghi chú nguồn phù hợp.

## Cấu hình triển khai

Backend dùng mặc định:

```env
MATERIAL_UPLOAD_DIR=/app/uploads/materials
MATERIAL_UPLOAD_URL_PREFIX=/uploads/materials
MATERIAL_MAX_FILE_BYTES=20971520
MATERIAL_MAX_FILES_PER_REQUEST=5
```

Frontend có thể cấu hình link thư mục Drive gốc cho học viên:

```env
VITE_OPEN_MATERIALS_DRIVE_ROOT_URL=https://drive.google.com/drive/folders/...
```

Nếu biến này chưa có, trang vẫn hoạt động; học viên sẽ thấy thông báo admin cần cấu hình link Drive.

## Backup và dọn dẹp

- Backup PostgreSQL để giữ catalog và lịch sử review.
- Backup Docker volume đang mount `/app/uploads` nếu muốn giữ file pending/rejected.
- Định kỳ xóa file rejected quá cũ sau khi đã ghi chú và không cần đối chiếu nữa.
- Google Drive nên có cấu trúc thư mục theo môn/chuyên đề, ví dụ:
  - `01_Tieng_Viet`
  - `02_Tieng_Anh`
  - `03_Toan_Pho_Thong`
  - `04_Tu_Duy_Khoa_Hoc`
  - `Community_Approved`

## Gợi ý chuyển đổi học viên

- Giữ catalog công khai để kéo traffic từ Google.
- Tạo badge “Đã duyệt” và “Nổi bật” cho tài liệu chất lượng cao.
- Cho học viên truy cập thư mục Drive gốc đầy đủ hơn catalog public.
- Ưu tiên duyệt đóng góp của học viên để tăng cảm giác quyền lợi.
- Gắn CTA từ tài liệu miễn phí sang `/dang-ky`, Q&A và quiz chuyên sâu.

## Admin Dashboard — tab "Tài liệu"

Trang `/admin` có tab **Tài liệu** với 4 sub-tab:

| Sub-tab | Mục đích | Thao tác chính |
|---|---|---|
| **Chờ duyệt** | Hàng đợi pending realtime với badge số lượng | Duyệt & publish, Từ chối, Xóa |
| **Tất cả gửi lên** | Lịch sử mọi submission (pending/approved/rejected) | Xem lại quyết định, xóa spam |
| **Kho công khai** | Bảng quản lý catalog, có search + bộ lọc (đang hiện/đang ẩn/nổi bật) | Toggle nhanh `is_published` / `is_featured`, chỉnh sửa metadata, xóa |
| **Thêm tài liệu mới** | Form admin tự thêm Drive URL không qua submission | Tạo entry catalog trực tiếp |

### Quy trình "Duyệt & Publish"

1. Vào sub-tab **Chờ duyệt**, mở file người dùng upload (link `/uploads/materials/...`).
2. Đảm bảo bản quyền và chất lượng đạt checklist ở trên.
3. Tải file đó lên Drive admin (thư mục công khai theo môn/chuyên đề).
4. Bấm **Duyệt & Publish** → modal mở:
   - **Drive URL công khai**: dán link Drive vừa upload. Mặc định prefill URL upload trên VPS — nên thay bằng Drive URL.
   - **Publish luôn vào catalog**: bật để tạo entry trong `open_materials` và hiển thị công khai ngay.
   - **Đánh dấu nổi bật**: gắn badge "⭐ Nổi bật".
   - **Ghi chú cho người gửi**: viết lời cảm ơn / hướng dẫn (sẽ hiện ở trang Đóng góp của họ).
5. Submission được cập nhật `status = approved`, gắn `published_material_id` trỏ sang record vừa tạo trong catalog.

### Quy trình "Từ chối"

- Luôn ghi rõ lý do trong **Ghi chú cho người gửi** để học viên có cơ hội chỉnh sửa rồi gửi lại.
- Lý do thường gặp: trùng tài liệu đã có, ảnh mờ, bản quyền không rõ, sai môn/chuyên đề.

### Quản lý catalog

- **Toggle "Hiển thị"**: ẩn tạm một tài liệu mà không xóa (vd: cần update Drive URL mới).
- **Toggle "Nổi bật"**: chỉ giữ tối đa 6–10 tài liệu nổi bật để giữ giá trị bộ sưu tập.
- **Chỉnh sửa**: dùng khi đổi link Drive, cập nhật tag/mô tả cho SEO tốt hơn, đổi category.
- **Xóa**: dành cho tài liệu vi phạm bản quyền hoặc lỗi thời. Hành động không reversible.

### Tự thêm tài liệu (không qua submission)

Dùng tab **Thêm tài liệu mới** khi admin muốn đẩy nhanh nội dung do team biên soạn:

- Upload file lên Drive admin trước, lấy URL "Anyone with the link can view".
- Điền tiêu đề + mô tả tối ưu SEO (chứa từ khóa "đánh giá năng lực", "đề thi", môn học, năm).
- Tag dạng kebab-case (`dgnl`, `tieng-viet`, `lop-12`, `de-thi-thu`) — giúp filter trang public.
- Bật **Hiển thị công khai** và **Đánh dấu nổi bật** nếu là tài liệu trọng tâm.
