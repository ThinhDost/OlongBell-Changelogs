# 🎁 Phase 3: In-game Rewards Claim Portal

Xây dựng cổng nhận quà trên trang web và thực hiện gửi lệnh qua giao thức RCON tới máy chủ Minecraft.

## 📋 Checklist Triển khai
- [ ] Cấu hình RCON trên máy chủ Minecraft (chỉ cho phép địa chỉ IP của Cloudflare Worker kết nối hoặc sử dụng Proxy trung gian).
- [ ] Lưu trữ mật khẩu RCON làm Secret trong Cloudflare Worker (không bao giờ viết trực tiếp trong code).
- [ ] Xây dựng API `/api/rewards/claim` kiểm tra điều kiện và thực hiện lệnh RCON gửi quà.
- [ ] Thiết kế trang giao diện `/rewards.html` hiển thị danh sách quà và trạng thái "Đã nhận / Chưa nhận".

## 🛡️ Bản vá Bảo mật & Tối ưu (Security Fixes)
1. **Chống tấn công Race Condition (Double Claim):**
   * *Vấn đề:* Cloudflare Worker xử lý song song không đồng bộ. Nếu người dùng click nút "Nhận quà" nhiều lần trong cùng 1 mili giây, các request song song có thể cùng đọc trạng thái KV là "Chưa nhận" và thực thi RCON trao quà nhiều lần.
   * *Giải pháp:* Sử dụng cơ sở dữ liệu quan hệ **Cloudflare D1 (SQLite)** để lưu trạng thái claim thay vì KV Storage (KV có tính chất eventual consistency không phù hợp với các giao dịch tài chính/quà tặng). 
   * Áp dụng ràng buộc duy nhất (Unique Constraint) trên bảng dữ liệu:
     ```sql
     CREATE UNIQUE INDEX idx_user_reward ON claims (minecraft_username, reward_id);
     ```
     Khi có request trùng lặp chạy đồng thời, D1 sẽ từ chối ghi nhận bản ghi thứ 2 ở mức database, ngăn chặn triệt để lỗ hổng trùng quà.

2. **Chống Command Injection qua RCON:**
   * *Vấn đề:* Khi chạy lệnh RCON `give ${username} diamond 5`, nếu biến `username` không được lọc kỹ, kẻ xấu có thể chèn các ký tự điều khiển như dấu chấm phẩy hoặc khoảng trắng để chạy các lệnh phá hoại server (ví dụ: `ThinhDost; stop`).
   * *Giải pháp:* Tiếp tục kiểm tra nghiêm ngặt `minecraft_username` bằng Regex ở Phase 1 trước khi đưa vào chuỗi lệnh RCON.

3. **Hệ thống hàng đợi RCON dự phòng (RCON Queue):**
   * Kết nối RCON có thể bị timeout nếu mạng chập chờn hoặc máy chủ game bị lag. Backend cần lưu trạng thái claim vào DB trước, sau đó gửi lệnh. Nếu RCON thất bại, lưu lệnh vào hàng đợi để chạy lại sau, tránh việc trừ lượt nhận của người chơi nhưng họ chưa nhận được quà.
