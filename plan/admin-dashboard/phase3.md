# 🎨 Phase 3: Visual Editor UI

Hoàn thiện giao diện của trang quản trị `/admin.html` giúp Admin soạn thảo bài viết dễ dàng như viết Word, hỗ trợ định dạng Rich Text hoặc Markdown, kéo thả ảnh và xem trước (Preview) giao diện hiển thị trước khi đăng.

## 📋 Checklist Triển khai
- [ ] Tích hợp thư viện Markdown Editor nhẹ (như EasyMDE) hoặc WYSIWYG Editor (như Quill.js / TinyMCE).
- [ ] Xây dựng form nhập liệu với các trường: Phiên bản (Version), Tiêu đề (Title), Ảnh bìa (Image URL), Danh mục (Categories), Tóm tắt (Summary).
- [ ] Tạo module cho phép thêm động các Section (Tiêu đề mục + List các dòng tính năng).
- [ ] Thiết kế nút "Xem trước dạng 3D/Grid" giả lập giao diện trang chủ ngay trên Admin Panel.
- [ ] Kết nối các nút bấm "Lưu bản nháp" và "Xuất bản" tới API Backend ở Phase 2.

## 🛠️ Chi tiết kỹ thuật
- Sử dụng thư viện CSS sẵn có của dự án để trang Admin đồng bộ thiết kế tối (Dark Mode) và sang trọng như trang chủ.
- Xử lý tải ảnh bìa trực tiếp lên Cloudflare R2 Storage (nếu có cấu hình) để lấy link URL điền vào trường hình ảnh.
