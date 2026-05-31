# SEO Strategy — ĐGNL Mỗi Ngày

Tổng hợp toàn bộ cấu hình SEO của website, ưu tiên tận dụng **user-generated content** (Q&A, kho tài liệu, quiz luyện tập) để tăng số trang index miễn phí trên Google.

## 1. Mặt trận nội dung

| Loại nội dung | URL pattern | Nguồn | SEO target |
|---|---|---|---|
| Landing & marketing | `/`, `/dang-ky`, `/lien-he`, `/blog` | Tay viết | Brand keywords: "đgnl mỗi ngày", "luyện thi đgnl 2026" |
| Câu hỏi & trả lời cộng đồng | `/hoi-dap`, `/hoi-dap/:id` | Học viên + admin | Long-tail: "tại sao toán đgnl khó", "cách giải bài đọc hiểu …" |
| Kho tài liệu mở | `/kho-tai-lieu-mo` | Cộng đồng + admin | "tài liệu đgnl pdf", "đề thi thử ĐHQG HCM 2025" |
| Luyện tập chuyên sâu | `/luyen-tap-chuyen-sau/:slug` | JSON tĩnh trong `frontend/public/deep-practice` | "ôn tập ngữ pháp tiếng anh đgnl", "bài tập tiếng việt …" |
| Thi thử | `/thi-thu`, `/thi-thu/:slug` | JSON tĩnh trong `frontend/public/exams` | "đề thi thử đgnl …" |

Mỗi loại đều có nhiều URL → tăng cơ hội index. Cộng đồng đóng góp = content tự tăng trưởng.

## 2. Meta tags động

`frontend/src/App.jsx` chứa component `RouteSeoMeta` đăng ký:

- `<title>` riêng cho mỗi route
- `<meta name="description">`
- `<link rel="canonical">`
- Open Graph (`og:title`, `og:description`, `og:image`, `og:url`)
- Twitter card
- `robots` directive

Khi thêm route public mới, hãy bổ sung entry tại `RouteSeoMeta`.

## 3. Structured data (Schema.org JSON-LD)

Helper component: [frontend/src/components/JsonLd.jsx](frontend/src/components/JsonLd.jsx)

| Trang | Schema injected | Mục đích |
|---|---|---|
| `/` (Landing) | `EducationalOrganization` + `Course` | Knowledge panel, Rich result cho khóa học có giá |
| `/hoi-dap/:id` (public) | `QAPage` với `Question` + `acceptedAnswer` + `suggestedAnswer` | Rich result Q&A trên Google Search |
| `/kho-tai-lieu-mo` | `ItemList` của `LearningResource` | Tăng CTR cho từ khóa tài liệu |
| `/luyen-tap-chuyen-sau/:slug` | `Quiz` (có thể bổ sung) | Hiển thị Quiz card |

Builder helpers: `orgSchema()`, `courseSchema()`, `qaPageSchema()`, `learningResourceSchema()`, `quizSchema()`, `breadcrumbSchema()`.

> **Lưu ý**: Q&A có `visibility = private` sẽ KHÔNG inject JSON-LD và KHÔNG xuất hiện trong sitemap, đảm bảo privacy.

## 4. Sitemap động

Endpoint: `GET /api/seo/sitemap.xml` ([backend/app/routers/seo.py](backend/app/routers/seo.py))

Nginx proxy `/sitemap.xml` → endpoint trên ([nginx/nginx.conf](nginx/nginx.conf)), nên Google chỉ cần fetch `https://dgnlmoingay.com/sitemap.xml`.

Sitemap gồm:

1. **Static routes**: trang chủ, đăng ký, liên hệ, blog, hỏi đáp, kho tài liệu, thi thử, luyện tập chuyên sâu.
2. **Q&A public** (giới hạn 2000 mục, sort theo `last_activity_at`): mỗi câu hỏi `visibility = public` → `/hoi-dap/{id}` với `lastmod`.
3. **Open Materials** (đã publish): `/kho-tai-lieu-mo#material-{id}` với `lastmod = updated_at`.
4. **Deep practice quizzes**: đọc từ `frontend/public/deep-practice/index.json`.
5. **Exams**: đọc từ `frontend/public/exams/index.json`.

Cache nginx: 1 giờ. Backend không cache (luôn fresh).

### Biến môi trường

```env
# URL gốc public (dùng trong sitemap + JSON-LD)
PUBLIC_BASE_URL=https://dgnlmoingay.com

# Optional - chỉ cần khi backend chạy ngoài Docker và không tìm thấy frontend/public
FRONTEND_PUBLIC_DIR=/path/to/frontend/public
```

## 5. robots.txt

Endpoint: `GET /api/seo/robots.txt`, nginx proxy `/robots.txt` → backend.

Mặc định cho phép crawl tất cả, chặn các path nhạy cảm và chỉ sitemap:

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /uploads/

Sitemap: https://dgnlmoingay.com/sitemap.xml
```

## 6. Checklist khi thêm tính năng public mới

- [ ] Thêm route metadata vào `RouteSeoMeta` (App.jsx).
- [ ] Inject JSON-LD schema phù hợp (`Article`, `FAQPage`, `HowTo`, `Quiz`, …).
- [ ] Bổ sung URL vào `STATIC_ROUTES` trong `backend/app/routers/seo.py` HOẶC vào loop dynamic nếu là dữ liệu DB.
- [ ] Thêm internal link từ Landing/Header xuống trang mới.
- [ ] Đảm bảo trang có nội dung ngữ nghĩa (tiêu đề H1 duy nhất, mô tả đầy đủ).
- [ ] Kiểm tra Lighthouse SEO ≥ 90.

## 7. Tận dụng UGC để tăng trưởng nội dung

- **Q&A**: khuyến khích học viên đặt câu hỏi cụ thể (chèn ví dụ trong placeholder). Mỗi câu hỏi tốt = 1 trang SEO mới.
- **Open Materials**: cộng đồng đóng góp PDF/ảnh → sau khi admin duyệt, tự động xuất hiện trong sitemap + JSON-LD ItemList.
- **Deep Practice**: thêm bộ đề mới vào `frontend/public/deep-practice/`, cập nhật `index.json` → sitemap tự refresh.
- **Notifications/Blog**: dùng để publish các bài viết kinh nghiệm thi, hướng dẫn → nội dung evergreen.

## 8. Đo lường

- Google Search Console: theo dõi số URL được index, từ khóa hiển thị.
- Đăng ký sitemap: Search Console → Sitemaps → submit `https://dgnlmoingay.com/sitemap.xml`.
- Theo dõi `download_count` của materials và lượt vote/answer của Q&A để biết nội dung nào hút traffic.
- Cloudflare Analytics cho lượng request và bot traffic (Googlebot / Bingbot).

## 9. Performance cho SEO

Đã có sẵn:

- Gzip compression (nginx)
- Image lazy loading (Tailwind `loading="lazy"` ở các `<img>`)
- Code-split routes qua React Router lazy (nếu cần thêm: dùng `React.lazy` cho các page nặng)
- HTTPS qua Cloudflare + HSTS

## 10. Quick reference

```bash
# Kiểm tra sitemap đang trả về gì
curl https://dgnlmoingay.com/sitemap.xml | head -n 40

# Validate JSON-LD: dùng Rich Results Test
# https://search.google.com/test/rich-results

# Re-submit sitemap sau khi publish nhiều nội dung mới
# Vào Google Search Console → Sitemaps → "Submit"
```
