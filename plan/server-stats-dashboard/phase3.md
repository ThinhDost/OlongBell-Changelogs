# 📈 Phase 3: Server Performance & Events Charts

Giai đoạn cuối cùng sẽ tích hợp thêm hệ thống vẽ biểu đồ hiệu năng máy chủ (TPS, Ping) và bộ đếm ngược thời gian thực cho các sự kiện sắp diễn ra trong game.

## 📋 Checklist Triển khai
- [ ] Thiết lập một Cloudflare Worker Cron Trigger (chạy mỗi 5 phút) để ghi nhận chỉ số TPS (Ticks Per Second) của máy chủ game và lưu vào lịch sử KV.
- [ ] Tích hợp thư viện đồ thị gọn nhẹ (ví dụ: Chart.js hoặc ApexCharts bản tối giản) để vẽ đường biểu diễn TPS/RAM.
- [ ] Tạo module "Sự Kiện Sắp Diễn Ra" trên trang chủ:
  - Cho phép admin cấu hình lịch sự kiện (như Boss Void Dragon xuất hiện, Event Đua Thuyền...).
  - Thiết kế đồng hồ đếm ngược (Countdown Timer) bằng JavaScript động.
- [ ] Gửi thông báo đẩy (Push Notification hoặc Webhook Discord) khi sự kiện sắp bắt đầu.

## 🛠️ Chi tiết kỹ thuật
- TPS của Minecraft lý tưởng là 20.0. Đồ thị sẽ hiển thị đường line TPS trong vòng 24h qua.
- Thời gian đếm ngược sự kiện được đồng bộ với giờ hệ thống của server để tránh sai lệch múi giờ của người dùng.
