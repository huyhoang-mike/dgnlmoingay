# Quản lý hệ thống Q&A

Tài liệu này hướng dẫn vận hành chức năng **Hỏi đáp Q&A** tại `/hoi-dap`.

## 1. Mục tiêu marketing/SEO

Q&A được thiết kế để tăng traffic tự nhiên và chuyển đổi học viên:

- **Câu hỏi public** có thể được Google index, giúp website có thêm nội dung long-tail như “vì sao câu ĐGNL này chọn B”, “giải Toán biểu đồ ĐGNL”.
- **Người chưa mua khóa học** vẫn được hỏi, nhưng câu hỏi bắt buộc công khai để tạo nội dung cho website.
- **Học viên đã đăng ký** có thể chọn hỏi công khai hoặc chỉ trong khóa học.
- **Câu hỏi học viên** được đánh dấu ưu tiên, giúp admin tập trung trả lời trước.
- **Câu trả lời của admin** tự động đánh dấu câu hỏi là `answered`, tạo tín hiệu chất lượng cho người xem mới.

## 2. Luồng sử dụng

### Người dùng chưa đăng nhập

- Xem được danh sách câu hỏi public.
- Xem được chi tiết câu hỏi public và câu trả lời.
- Không thể đăng câu hỏi hoặc trả lời.

### Người dùng đã đăng nhập nhưng chưa đăng ký khóa học

- Đăng được câu hỏi và trả lời.
- Câu hỏi luôn ở chế độ `public`.
- Không xem được câu hỏi `course` chỉ dành cho học viên.

### Học viên đã đăng ký khóa học

- Đăng được câu hỏi `public` hoặc `course`.
- Câu hỏi được gắn `is_priority = true`.
- Xem được cả câu hỏi public và câu hỏi trong khóa học.

### Admin

- Trả lời câu hỏi với nhãn admin.
- Khi admin trả lời, câu hỏi chuyển sang trạng thái `answered`.
- Có thể xem tất cả câu hỏi qua API với `scope=all`.

## 3. Lưu trữ dữ liệu và hình ảnh

### Metadata trong PostgreSQL

Các bảng mới:

- `qa_questions`: tiêu đề, nội dung, ảnh, phạm vi hiển thị, trạng thái, tác giả, số trả lời.
- `qa_answers`: nội dung trả lời, ảnh, tác giả, cờ admin answer.

Migration: `backend/alembic/versions/006_qa_system.py`.

### Ảnh trên VPS volume

Ảnh được upload qua FastAPI và lưu trong Docker volume:

```yaml
qa_uploads:/app/uploads
```

URL public có dạng:

```text
/uploads/qa/YYYY/MM/<uuid>.jpg
```

Nginx proxy `/uploads/` về backend để FastAPI phục vụ static files. Cách này miễn phí, tự động, dễ backup và không phụ thuộc API bên ngoài.

## 4. Vì sao chưa dùng Google Drive làm mặc định?

Google Drive phù hợp để lưu tài liệu lớn, nhưng không tối ưu làm image CDN cho Q&A vì:

- Cần OAuth/service account và xử lý quyền chia sẻ file tự động.
- Link ảnh Drive có thể không ổn định cho hiển thị trực tiếp.
- Tốc độ tải ảnh nhỏ thường kém hơn lưu local VPS + Cloudflare cache.

Khuyến nghị hiện tại:

- **Mặc định**: lưu ảnh Q&A trên VPS volume `qa_uploads`.
- **Backup định kỳ**: đồng bộ `/app/uploads` lên Google Drive bằng `rclone` nếu muốn.
- **Khi traffic lớn**: cân nhắc Cloudflare R2 hoặc S3-compatible storage.

## 5. API chính

| Method | Endpoint | Quyền | Mục đích |
| --- | --- | --- | --- |
| `GET` | `/api/qa/questions` | Public | Danh sách câu hỏi public; học viên thấy thêm câu hỏi course. |
| `GET` | `/api/qa/questions/{id}` | Public hoặc học viên | Chi tiết câu hỏi và câu trả lời. |
| `POST` | `/api/qa/questions/form` | Đăng nhập | Tạo câu hỏi kèm ảnh multipart. |
| `POST` | `/api/qa/questions/{id}/answers/form` | Đăng nhập | Trả lời câu hỏi kèm ảnh multipart. |
| `POST` | `/api/qa/uploads` | Đăng nhập | Upload ảnh riêng, trả về URL. |
| `PATCH` | `/api/qa/questions/{id}/pin` | Admin | Ghim hoặc bỏ ghim câu hỏi. |

Tham số hữu ích cho `GET /api/qa/questions`:

- `scope=auto`: mặc định; public cho khách, public + course cho học viên.
- `scope=mine`: câu hỏi của người đang đăng nhập.
- `scope=course`: chỉ câu hỏi trong khóa học.
- `scope=all`: admin xem tất cả.
- `subject=Toán`: lọc theo môn/phần.
- `q=keyword`: tìm theo tiêu đề/nội dung.

## 6. Quy tắc upload ảnh

- Tối đa 4 ảnh mỗi request.
- Tối đa 5MB mỗi ảnh.
- Hỗ trợ `jpg`, `png`, `webp`, `gif`.
- Ảnh được đặt tên bằng UUID để tránh trùng và tránh lộ tên file gốc.

## 7. Backup ảnh Q&A

Ví dụ backup thủ công từ VPS:

```bash
docker run --rm -v dgnlmoingay_qa_uploads:/data -v "$PWD/backups:/backup" alpine \
  tar -czf /backup/qa_uploads_$(date +%Y%m%d).tar.gz -C /data .
```

Nếu muốn đồng bộ Google Drive tự động, có thể cài `rclone` trên VPS và tạo cron job sync thư mục volume backup lên Drive.

## 8. Gợi ý vận hành để tăng chuyển đổi

- Trả lời nhanh các câu hỏi public có từ khóa tốt để tăng khả năng lên Google.
- Ghim các câu hỏi chất lượng cao, có lời giải rõ và liên quan đến dạng bài phổ biến.
- Với câu hỏi công khai của người chưa mua, cuối câu trả lời có thể nhắc nhẹ: “Nếu muốn được ưu tiên hỗ trợ và xem đầy đủ bài giảng, em có thể tham khảo khóa học.”
- Khuyến khích học viên đặt câu hỏi `course` khi có thông tin cá nhân/lộ trình riêng, và đặt `public` khi là câu hỏi kiến thức chung.
