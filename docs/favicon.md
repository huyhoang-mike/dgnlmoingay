# Favicon (icon hiển thị trên Bing/Google)

## Vì sao Bing không hiện icon còn Google lại có?

- Nhiều crawler (đặc biệt Bing) ưu tiên lấy icon từ URL mặc định: `/favicon.ico`.
- Website hiện là SPA, nên nếu **không có** file `/favicon.ico` trong `frontend/public/`, Nginx sẽ fallback về `index.html` và trả **HTML** tại `/favicon.ico` → Bing thường bỏ qua.
- Google thường linh hoạt hơn và có thể dùng icon từ thẻ `<link rel="icon" ...>`.

## Bộ file nên có (khuyến nghị)

Để tương thích tốt trên hầu hết browsers + search engines, nên có đủ các file sau trong `frontend/public/`:

- `favicon.ico` (nên chứa nhiều size: 16x16, 32x32, 48x48)
- `favicon-16x16.png`
- `favicon-32x32.png`
- `favicon-48x48.png` (giúp đáp ứng yêu cầu tối thiểu của Google)
- `apple-touch-icon.png` (180x180 — iOS)
- `android-chrome-192x192.png` (PWA/Android)
- `android-chrome-512x512.png` (PWA/Android)
- `site.webmanifest`
- (tuỳ chọn) `favicon.svg` (dùng tốt trên trình duyệt hiện đại, nhưng không nên là định dạng duy nhất)

Dự án đã cấu hình các link tương ứng trong `frontend/index.html`.

## Tạo favicon từ logo như thế nào?

### Cách dễ nhất (khuyến nghị): RealFaviconGenerator

1. Chuẩn bị logo nguồn (khuyến nghị):
   - SVG vuông (tốt nhất), hoặc PNG 1024x1024.
   - Logo nên có **padding** xung quanh (đừng sát viền).
2. Vào RealFaviconGenerator (realfavicongenerator.net):
   - Upload logo
   - Tuỳ chỉnh màu nền/viền nếu cần
   - Download gói favicon
3. Copy toàn bộ file trong gói vào `frontend/public/`.
4. Deploy lại frontend.
5. Nếu dùng Cloudflare: Purge cache.

### Cách tối thiểu (nhanh) để Bing dễ nhận

- Chỉ cần tạo `frontend/public/favicon.ico` là đã cải thiện đáng kể cho Bing.
- Đảm bảo URL này trả về **image** (200 OK) chứ không phải HTML:
  - `https://dgnlmoingay.com/favicon.ico`

## Cần đủ `.ico`, `.png`, `.svg` hay chỉ 1 định dạng?

- **Không nên chỉ dùng 1 định dạng** nếu mục tiêu là “ổn định trên mọi search engines”.
- Tối thiểu nên có **`favicon.ico`** (vì nhiều hệ thống/crawler vẫn ưu tiên nó).
- Nên thêm PNG theo size phổ biến (16/32/48) để:
  - đáp ứng tiêu chí của Google,
  - hỗ trợ trình duyệt/thiết bị không đọc tốt ICO.
- SVG là **tuỳ chọn**: hữu ích cho trình duyệt hiện đại, nhưng **không nên** là định dạng duy nhất.

## Logo trên tab/dark mode: file nào và nên chỉnh gì?

- Icon trên tab trình duyệt được khai báo trong `frontend/index.html`, ưu tiên các file trong `frontend/public/`:
  - `favicon.svg` cho trình duyệt hiện đại.
  - `favicon.ico` cho browser/search engine cũ hoặc crawler ưu tiên URL mặc định.
  - `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png` cho PNG fallback.
- Nếu logo **màu đen + nền trong suốt**, icon dễ bị chìm ở dark mode hoặc khi search engine đặt trên nền tối.
- Nên dùng **nền tròn tương phản cao** và glyph sáng. Dự án hiện dùng nền tròn xanh đậm, viền xanh sáng và logo trắng để rõ hơn trên Bing/DuckDuckGo/browser tab.
- Sau khi đổi icon, `frontend/index.html` và `site.webmanifest` nên có version query để tránh cache cũ, ví dụ `?v=20260516`.

## Sau khi deploy: làm Bing cập nhật nhanh hơn

- Xác nhận các URL icon trả 200 OK:
  - `/favicon.ico`, `/favicon-48x48.png`, ...
- Dùng Bing Webmaster Tools:
  - URL Inspection → Request indexing trang chủ.
- Chờ Bing recrawl (có thể vài ngày đến vài tuần tuỳ site).
