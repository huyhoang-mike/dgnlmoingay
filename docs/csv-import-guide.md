# Hướng dẫn Import Bài Học bằng CSV

Tài liệu này mô tả cách tạo file CSV để nhập hàng loạt bài học vào hệ thống thay vì thao tác thủ công trên giao diện Admin.

---

## 1. Cấu trúc File CSV

### Tên cột (header)

| Cột | Bắt buộc | Kiểu | Mô tả |
|-----|----------|------|-------|
| `title` | ✅ Có | Text | Tên bài học. Nếu ô này trống, hàng sẽ bị bỏ qua hoàn toàn. |
| `description` | Không | Text | Mô tả ngắn hiển thị trong danh sách bài học. |
| `order` | Không | Số nguyên | Thứ tự hiển thị trong danh sách (mặc định: số thứ tự hàng trong file). |
| `category` | Không | Enum | Danh mục: `nentang`, `luyende`, hoặc `thucchien` (mặc định: `nentang`). |
| `subject` | Không | Text | Môn học (vd: `toan`, `tieng_viet`, `vat_ly`, `hoa_hoc`, `sinh_hoc`). |
| `video_drive_id` | Không | Text | ID file video trên Google Drive. Để trống nếu không có video. |
| `pdf_drive_id` | Không | Text | ID file PDF trên Google Drive. Để trống nếu không có tài liệu. |
| `content` | Không | Text | Nội dung bài học (HTML hoặc Markdown). Có thể để trống. |
| `is_published` | Không | Boolean | `true` để hiển thị, `false` để ẩn (mặc định: `false`). |
| `is_free` | Không | Boolean | `true` nếu học sinh chưa đăng ký vẫn xem được (mặc định: `false`). |

### Giá trị hợp lệ cho cột Boolean (`is_published`, `is_free`)

Hệ thống chấp nhận các giá trị sau (không phân biệt hoa thường):

| Ý nghĩa | Giá trị được chấp nhận |
|---------|----------------------|
| TRUE | `true`, `1`, `yes`, `có`, `x` |
| FALSE | `false`, `0`, `no`, `không`, *(để trống)* |

### Lấy Google Drive File ID

URL file trên Drive thường có dạng:
```
https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/view
                                  ↑ Đây là Drive File ID
```
Copy phần `1aBcDeFgHiJkLmNoPqRsTuVwXyZ` và dán vào cột `video_drive_id` hoặc `pdf_drive_id`.

---

## 2. Ví dụ File CSV

```csv
title,description,order,category,subject,video_drive_id,pdf_drive_id,is_published,is_free
Tổng quan về ĐGNL,Giới thiệu cấu trúc bài thi,1,nentang,,,,true,true
Kỹ năng đọc hiểu cơ bản,Phân tích văn bản ngắn,2,nentang,tieng_viet,1aBcDeFgHiJkLmN,2xYzAbCdEfGhIj,true,false
Kỹ năng đọc hiểu nâng cao,Văn bản dài và câu hỏi suy luận,3,nentang,tieng_viet,3kLmNoPqRsTuVw,,true,false
Toán đại số cơ bản,Hàm số và phương trình bậc nhất,1,nentang,toan,4xYzAbCdEfGhIj,5kLmNoPqRsTuVw,true,false
Luyện đề Tiếng Việt số 1,,1,luyende,tieng_viet,6aBcDeFgHiJkLm,,true,false
Luyện đề Toán số 1,,1,luyende,toan,,,false,false
```

---

## 3. Các lưu ý quan trọng khi tạo file

### Encoding (Quan trọng!)
File CSV **phải** được lưu với encoding **UTF-8** hoặc **UTF-8 with BOM** để hiển thị đúng tiếng Việt.

**Trong Excel:**
1. `File → Save As → Browse`
2. Chọn `CSV UTF-8 (Comma delimited) (*.csv)`

**Trong Google Sheets:**
1. `File → Download → Comma Separated Values (.csv)`
Google Sheets mặc định xuất UTF-8, hoàn toàn ổn.

### Ký tự phân cách (Delimiter)
Dùng **dấu phẩy (`,`)** làm ký tự phân cách. Nếu nội dung text có chứa dấu phẩy, hãy bao toàn bộ ô đó trong **dấu nháy kép** `"`.

Ví dụ:
```csv
"Bài tập: Ngữ pháp, chính tả và dùng từ",Mô tả bài tập,...
```

### Cột `content` chứa HTML
Nếu muốn nhập nội dung HTML vào cột `content`, bao toàn bộ nội dung trong dấu nháy kép và escape dấu nháy kép bên trong bằng cách viết thành `""`:

```csv
"Bài học A","<p>Đây là đoạn văn.</p><p class=""highlight"">Đoạn nổi bật.</p>",1,...
```

---

## 4. Cách gọi API Import

### Dùng `curl` (trên VPS hoặc terminal)

```bash
# Lấy JWT token trước bằng cách đăng nhập Google trên website
# Sau đó copy token từ localStorage (F12 → Application → Local Storage → token)

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Import với mode skip (bỏ qua bài đã tồn tại — AN TOÀN nhất)
curl -X POST "https://dgnlmoingay.com/api/lessons/import?mode=skip" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./lessons.csv"

# Import với mode overwrite (ghi đè bài đã tồn tại)
curl -X POST "https://dgnlmoingay.com/api/lessons/import?mode=overwrite" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./lessons.xlsx"
```

### Kết quả trả về

```json
{
  "message": "Import hoàn tất: 12 tạo mới, 3 cập nhật, 1 bỏ qua",
  "created": 12,
  "updated": 3,
  "skipped": 1,
  "total_rows": 16
}
```

### 3 chế độ import (`mode`)

| Mode | Hành vi | Khi nào dùng |
|------|---------|-------------|
| `skip` | Nếu bài học đã tồn tại (cùng `title` + `category` + `subject`), bỏ qua | Lần đầu import, muốn an toàn |
| `overwrite` | Cập nhật bài đã tồn tại với dữ liệu mới từ file | Cần cập nhật hàng loạt |
| `append` | Luôn tạo mới, không kiểm tra trùng | Khi chắc chắn dữ liệu chưa có |

---

## 5. Kiểm tra sau khi import

```bash
# Export toàn bộ bài học ra JSON để kiểm tra
curl "https://dgnlmoingay.com/api/lessons/export" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool | head -100

# Hoặc lọc theo category
curl "https://dgnlmoingay.com/api/lessons/export?category=nentang" \
  -H "Authorization: Bearer $TOKEN"
```
