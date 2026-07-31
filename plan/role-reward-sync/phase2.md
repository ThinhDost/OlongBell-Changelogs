# 🎖️ Phase 2: Discord Role & Rank Syncing

Đọc các quyền (role) trên Discord Server của người dùng và hiển thị huy hiệu danh hiệu tương ứng trên trang web (ví dụ như khi họ bình luận, thả tim hoặc hiển thị trên bảng xếp hạng).

## 📋 Checklist Triển khai
- [ ] Cấu hình ánh xạ giữa **Discord Role ID** và **Tên Huy Hiệu / Màu Sắc** trên Website.
- [ ] Viết hàm lấy vai trò của người dùng thông qua Discord OAuth2 token:
  - Gọi API `/users/@me/guilds/<guild_id>/member` để kiểm tra các role của thành viên.
- [ ] Chỉnh sửa giao diện bình luận và danh sách thả tim trên web để hiển thị huy hiệu (ví dụ: Icon Vương miện cho [Admin], Ngôi sao cho [VIP]).
- [ ] Tích hợp tính năng đồng bộ Rank ngược lại: Nếu người dùng quyên góp (Donate) mua VIP trên web, hệ thống tự động add role VIP trên Discord cho họ.

## 🛠️ Chi tiết kỹ thuật
Bảng cấu hình vai trò mẫu:
```javascript
const ROLE_BADGES = {
  "112233445566778899": { name: "Admin", color: "#ff3333", icon: "👑" },
  "998877665544332211": { name: "VIP", color: "#gold", icon: "⭐" },
  "445566778899112233": { name: "Contributor", color: "#33ccff", icon: "🛠️" }
};
```
Mỗi khi render profile, hệ thống duyệt mảng role của user và hiển thị các icon tương ứng.
