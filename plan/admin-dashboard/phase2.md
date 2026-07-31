# 🗄️ Phase 2: Dynamic Changelog API & DB Migration

Giai đoạn này dịch chuyển cơ sở dữ liệu từ file JS tĩnh lên dịch vụ lưu trữ đám mây Cloudflare KV hoặc Cloudflare D1 để hỗ trợ các thao tác CRUD (Create, Read, Update, Delete) thời gian thực.

## 📋 Checklist Triển khai
- [ ] Thiết kế cấu trúc database lưu trữ (ví dụ: bảng `changelogs` và `sneak_peeks` trên Cloudflare D1 hoặc lưu chuỗi JSON trong KV với key `changelog:<version>`).
- [ ] Viết API endpoint `GET /api/changelogs` trả về danh sách được gộp từ DB (thay thế cho `changelogs-data.js`).
- [ ] Viết các API CRUD có bảo mật bằng token xác thực Admin ở Phase 1:
  - `POST /api/admin/changelogs` (Tạo mới)
  - `PUT /api/admin/changelogs/:id` (Cập nhật)
  - `DELETE /api/admin/changelogs/:id` (Xóa)
- [ ] Tạo script migrate chuyển toàn bộ dữ liệu từ `changelogs-data.js` hiện tại lên DB để giữ nguyên lịch sử cập nhật.

## 🛠️ Chi tiết kỹ thuật
- **KV Storage Schema**:
  - `changelogs:list` -> Mảng JSON chứa tóm tắt danh sách changelogs phục vụ cho việc render nhanh trang chủ.
  - `changelog:<id>` -> Object JSON chi tiết của từng bài viết (nếu bài viết rất dài).
- Mỗi khi Admin lưu hoặc sửa, Worker tự động cập nhật cả bản ghi đơn lẻ lẫn danh sách gộp `changelogs:list`.
