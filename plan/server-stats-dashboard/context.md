# 🎮 Context: Interactive Real-time Server Dashboard

## 1. Giới thiệu Ý tưởng
Một trang web giới thiệu máy chủ Minecraft sẽ hấp dẫn hơn rất nhiều nếu người dùng có thể xem được trạng thái trực tuyến của máy chủ ngay lập tức.
Ý tưởng này đề xuất tích hợp một **Bảng điều khiển & Thống kê Thời gian thực** trực tiếp lên trang chủ. Người chơi có thể thấy số lượng người đang chơi, danh sách tên + ảnh skin 3D của họ, chỉ số hiệu năng máy chủ (TPS, Ping) và thời gian đếm ngược tới các sự kiện (Events) sắp diễn ra.

## 2. Mục tiêu
- Tạo cảm giác thế giới game đang hoạt động sôi nổi ngay trên trang web.
- Tự động lấy dữ liệu từ máy chủ Minecraft mà không gây ảnh hưởng tới hiệu năng của game (sử dụng cache/API trung gian).
- Tăng tính tương tác thông qua việc hiển thị danh sách người chơi trực tuyến.

## 3. Kiến trúc Đề xuất
- **Minecraft Server**: Bật giao thức Query (GS4) hoặc cài đặt plugin xuất dữ liệu (như Plan / WebAPI / PlaceholderAPI).
- **Backend (Worker)**: Thực hiện truy vấn định kỳ (cron job) thông qua cổng query của Server hoặc thông qua API trung gian (MCSrvStat / Minetools). Lưu thông tin này vào KV Storage để cache dữ liệu (tránh spam request làm lag game).
- **Frontend**: Hiển thị widget Server Status và danh sách skin người chơi ở Hero Section hoặc một tab riêng.
