# Quản lý Luyện tập chuyên sâu

Tài liệu này hướng dẫn thêm/sửa các quiz trong khu vực **Luyện tập chuyên sâu** tại `/luyen-tap-chuyen-sau`.

## 1. Mục tiêu marketing/SEO

Chức năng này được thiết kế để tăng lượt truy cập tự nhiên và chuyển đổi học viên:

- **Quiz miễn phí**: cho học sinh trải nghiệm nhanh, tăng thời gian ở lại website và tạo thói quen quay lại.
- **Quiz học viên**: khóa nội dung nâng cao để tạo động lực đăng ký khóa học.
- **Theo từng phần nhỏ**: dễ SEO theo từ khóa như “luyện tiếng Việt ĐGNL”, “toán biểu đồ đánh giá năng lực”, “quiz tiếng Anh V-ACT”.
- **CTA rõ ràng**: trang danh sách có nút “Bắt đầu luyện miễn phí” và “Mở khóa toàn bộ quiz”; quiz bị khóa dẫn về trang đăng ký.

## 2. Cấu trúc thư mục

Các file quiz nằm trong:

```text
frontend/public/deep-practice/
├── index.json
├── tieng-viet-tu-vung-ngu-nghia-co-ban.json
├── toan-bieu-do-so-lieu-ung-dung.json
└── tieng-anh-doc-hieu-main-idea.json
```

Ảnh minh họa có thể đặt trong một thư mục public, ví dụ:

```text
frontend/public/deep-practice/images/
```

Khi tham chiếu trong JSON, dùng đường dẫn bắt đầu bằng `/`, ví dụ:

```json
"image": "/deep-practice/images/bieu-do-doanh-thu.png"
```

## 3. Thêm một quiz mới

### Bước 1: Thêm metadata vào `index.json`

Mở `frontend/public/deep-practice/index.json` và thêm object mới:

```json
{
  "id": "toan-ti-le-phan-tram-co-ban",
  "title": "Toán: Tỉ lệ phần trăm cơ bản",
  "subject": "Toán",
  "skill": "Tỉ lệ phần trăm",
  "level": "Cơ bản",
  "description": "Luyện nhanh các câu hỏi phần trăm thường gặp trong ĐGNL.",
  "timeMinutes": 12,
  "totalQuestions": 5,
  "isFree": true,
  "isPublished": true,
  "file": "toan-ti-le-phan-tram-co-ban.json",
  "seoKeywords": ["luyện toán ĐGNL", "tỉ lệ phần trăm", "quiz đánh giá năng lực"]
}
```

Ý nghĩa các trường quan trọng:

| Trường | Ý nghĩa |
| --- | --- |
| `id` | ID duy nhất, dùng trên URL `/luyen-tap-chuyen-sau/:id`. Không dùng dấu hoặc khoảng trắng. |
| `title` | Tên hiển thị của quiz. Nên chứa môn + dạng bài để tốt cho SEO. |
| `subject` | Môn/phần để filter: `Tiếng Việt`, `Tiếng Anh`, `Toán`, `Tư duy khoa học`, ... |
| `skill` | Kỹ năng nhỏ hoặc dạng bài. |
| `level` | Độ khó hiển thị trên card. |
| `description` | Mô tả ngắn, nên nêu lợi ích cho học sinh. |
| `timeMinutes` | Thời gian gợi ý. |
| `totalQuestions` | Tổng số câu trong file quiz. |
| `isFree` | `true` là quiz miễn phí; `false` chỉ học viên đã đăng ký mới xem được. |
| `isPublished` | `true` để hiển thị; `false` để ẩn tạm. |
| `file` | Tên file JSON chứa câu hỏi. |
| `seoKeywords` | Từ khóa nội bộ để định hướng nội dung. Hiện chưa hiển thị trực tiếp. |

### Bước 2: Tạo file câu hỏi

Tạo file `frontend/public/deep-practice/toan-ti-le-phan-tram-co-ban.json`:

```json
{
  "id": "toan-ti-le-phan-tram-co-ban",
  "title": "Toán: Tỉ lệ phần trăm cơ bản",
  "subject": "Toán",
  "timeMinutes": 12,
  "questions": [
    {
      "id": "percent-001",
      "prompt": "Một lớp có 50 học sinh, trong đó 40% là nữ. Số học sinh nữ là bao nhiêu?",
      "options": [
        { "key": "A", "text": "18" },
        { "key": "B", "text": "20" },
        { "key": "C", "text": "22" },
        { "key": "D", "text": "25" }
      ],
      "answer": "B",
      "explanation": "50 × 40% = 20.",
      "tags": ["phần trăm", "cơ bản"]
    }
  ]
}
```

## 4. Câu hỏi có hình ảnh

### Hình trong đề bài

```json
{
  "id": "chart-001",
  "prompt": "Quan sát biểu đồ và chọn nhận xét đúng.",
  "image": "/deep-practice/images/bieu-do-001.png",
  "options": [
    { "key": "A", "text": "Doanh thu tăng đều" },
    { "key": "B", "text": "Doanh thu giảm đều" },
    { "key": "C", "text": "Doanh thu dao động" },
    { "key": "D", "text": "Không có dữ liệu" }
  ],
  "answer": "C",
  "explanation": "Quan sát các cột cho thấy số liệu tăng giảm không đều."
}
```

### Hình trong đáp án

```json
{
  "key": "A",
  "text": "Chọn vùng được tô màu",
  "image": "/deep-practice/images/dap-an-a.png"
}
```

### Hình trong giải thích

```json
"explanationImage": "/deep-practice/images/giai-thich-001.png"
```

## 5. Quiz miễn phí và quiz dành cho học viên

- Quiz miễn phí: đặt `"isFree": true` trong `index.json`.
- Quiz dành cho học viên: đặt `"isFree": false`.

Nếu `isFree` là `false`, người chưa có quyền học viên sẽ thấy màn hình khóa và CTA về `/dang-ky`. Quyền học viên dùng lại logic hiện tại của website: `is_enrolled` hoặc `is_admin`.

## 6. Checklist trước khi publish

- `id` trong `index.json` trùng với `id` trong file quiz.
- `file` trỏ đúng tên file JSON.
- `totalQuestions` bằng số phần tử trong `questions`.
- Mỗi câu có `id`, `prompt`, `options`, `answer`, `explanation`.
- `answer` khớp với một `key` trong `options`.
- Ảnh nằm trong `frontend/public/...` và đường dẫn bắt đầu bằng `/`.
- Nếu muốn ẩn quiz tạm thời, dùng `"isPublished": false`.

## 7. Gợi ý viết nội dung để tăng chuyển đổi

- Tạo nhiều quiz miễn phí ngắn, mỗi quiz 4-8 câu, tập trung vào một vấn đề nhỏ.
- Cuối mỗi quiz nên giải thích đủ rõ để học sinh thấy giá trị của hệ thống.
- Dùng quiz học viên cho dạng nâng cao, dạng bẫy, hoặc bộ câu hỏi sát đề thật.
- Tiêu đề nên theo mẫu: `Môn: Dạng bài cụ thể`, ví dụ `Tiếng Việt: Từ vựng & ngữ nghĩa`, `Toán: Biểu đồ & số liệu`.
- Ưu tiên xuất bản quiz theo các từ khóa học sinh hay tìm kiếm trước kỳ thi.
