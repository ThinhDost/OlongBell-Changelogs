# 📊 Context: Admin Dashboard & Dynamic Changelog Editor

## 1. Giới thiệu Ý tưởng
Hiện tại, dữ liệu changelog và sneak peeks của OlongBell đang được lưu trữ tĩnh trong file `changelogs-data.js`. Mỗi lần cập nhật phiên bản mới, quản trị viên (Admin) hoặc nhà phát triển phải can thiệp trực tiếp vào mã nguồn. 
Ý tưởng này hướng tới việc tạo ra một **Trang Quản trị (Admin Dashboard)** bảo mật trên website. Admin có thể đăng nhập bằng Discord (được xác thực quyền qua Role trên Discord Server) để trực tiếp viết, sửa, xóa các bài đăng Changelog hoặc Sneak Peek thông qua giao diện trực quan sinh động (WYSIWYG/Markdown Editor) mà không cần động vào code.

## 2. Mục tiêu
- Xây dựng phân hệ Admin Panel bảo mật, dễ sử dụng.
- Tự động hóa quy trình viết changelog và cập nhật thời gian thực lên trang chủ thông qua API.
- Tận dụng lưu trữ đám mây Cloudflare KV/D1 thay thế cho dữ liệu tĩnh.

## 3. Kiến trúc Đề xuất
- **Frontend**: Một trang con `/admin.html` có giao diện soạn thảo văn bản, upload ảnh, quản lý danh sách changelogs.
- **Backend (Worker)**: Tích hợp xác thực phân quyền Discord Role và cung cấp các endpoint API (GET, POST, PUT, DELETE).
- **Database**: Cloudflare KV Storage hoặc Cloudflare D1 (SQLite) để lưu cấu trúc JSON của changelogs.
