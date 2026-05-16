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
