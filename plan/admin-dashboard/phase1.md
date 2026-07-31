# 🔐 Phase 1: Admin Authentication & Role Validation

Giai đoạn này tập trung vào việc bảo mật trang quản trị thông qua cơ chế phân quyền tài khoản Discord. 

## 📋 Checklist Triển khai
- [ ] Định nghĩa các biến môi trường bảo mật trong Cloudflare Worker:
  - `DISCORD_BOT_TOKEN` (Dùng Bot Token để truy vấn Discord API an toàn).
  - `DISCORD_GUILD_ID` (ID Server Discord của bạn).
  - `ADMIN_ROLE_IDS` (Mảng chứa ID các Role được phép truy cập Admin Panel).
  - `JWT_SECRET` (Khóa bí mật để ký mã Session Token cho client).
- [ ] Thiết lập endpoint `POST /api/admin/login` nhận Discord Access Token từ client, sau đó sử dụng Bot Token để lấy thông tin Member của user trên server.
- [ ] Triển khai cơ chế cấp phát **JSON Web Token (JWT)** riêng của ứng dụng sau khi xác thực thành công. Client sẽ gửi JWT này trong header `Authorization: Bearer <JWT>` cho các request tiếp theo thay vì dùng trực tiếp Discord Token.
- [ ] Tạo middleware kiểm tra và giải mã JWT trên Worker.
- [ ] Thiết kế trang giao diện `/admin.html` cơ bản, tự động chuyển hướng về trang chủ nếu kiểm tra JWT thất bại.

## 🛡️ Bản vá Bảo mật & Tối ưu (Security Fixes)
1. **Tránh Rate Limit từ Discord:** Nếu mỗi thao tác của Admin trên web đều phải gọi trực tiếp sang Discord API để check Role, hệ thống sẽ nhanh chóng bị Discord chặn (Rate Limit). Việc cấp phát một JWT nội bộ có thời hạn (ví dụ: 2 giờ) sẽ giúp Worker xác thực quyền hạn của Admin ngay tại bộ nhớ mà không cần gọi ra ngoài.
2. **Bảo mật phân quyền (Bot Token Method):** Thay vì yêu cầu Client cấp scope quyền hạn lớn như `guilds.members.read` (gây cảnh báo bảo mật cho user), Backend sẽ dùng **Discord Bot Token** của Server để truy vấn endpoint `/guilds/<guild_id>/members/<user_id>`. Điều này vừa an toàn hơn vừa đảm bảo tính chính xác tuyệt đối.
