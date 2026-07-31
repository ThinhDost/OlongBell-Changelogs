# 🔌 Phase 1: Minecraft Query Protocol Integration

Giai đoạn này tập trung vào việc lấy dữ liệu cơ bản (Trạng thái, Số lượng người chơi, Phiên bản) từ máy chủ Minecraft thực tế và truyền tải về website.

## 📋 Checklist Triển khai
- [ ] Bật cấu hình `query.port` trong file `server.properties` của máy chủ Minecraft.
- [ ] Viết hàm giải mã giao thức Minecraft Query (hoặc tích hợp thư viện như `mc-query` / sử dụng API miễn phí của `api.mcsrvstat.us`).
- [ ] Thiết lập cache KV Storage trên Worker để lưu kết quả query trong vòng 1-2 phút (tránh DDOS server game).
- [ ] Tạo API endpoint `GET /api/server/status` trả về dữ liệu server dạng JSON.
- [ ] Thiết kế và xây dựng Widget trạng thái ở Hero Section trên trang chủ (đèn xanh báo Online, số lượng người online / tối đa).

## 🛠️ Chi tiết kỹ thuật
- API trả về mẫu cấu trúc:
  ```json
  {
    "online": true,
    "version": "1.21.x Fabric",
    "players": {
      "online": 45,
      "max": 100,
      "list": ["ThinhDost", "giathang", "PlayerA"]
    },
    "motd": "Chào mừng đến với OlongBell Server!"
  }
  ```
- Nếu server bảo trì, hiển thị trạng thái Offline kèm theo ghi chú.
