# 🏅 Context: Discord Role Sync & Reward Claims

## 1. Giới thiệu Ý tưởng
Liên kết chặt chẽ giữa Website, Server Discord và Máy chủ Minecraft là chìa khóa để giữ chân và thu hút người chơi.
Ý tưởng này đề xuất một hệ thống **Đồng bộ vai trò (Rank/Roles) & Nhận quà trong game**. Người chơi sau khi liên kết tài khoản Discord của họ trên website sẽ được:
- Hiển thị danh hiệu (VIP, Staff, Top Donator...) tương ứng trên website bên cạnh Avatar của họ.
- Nhận các phần quà khuyến khích trực tiếp trong game Minecraft (ví dụ: Xu, chìa khóa mở rương, vật phẩm hiếm) cho các mốc nhiệm vụ hoặc lần đầu liên kết tài khoản.

## 2. Mục tiêu
- Kích thích người chơi tham gia Discord Server và tương tác trên website.
- Tạo tính độc quyền cho các danh hiệu và phần thưởng.
- Tự động hóa quá trình trao quà in-game từ hành động click trên web.

## 3. Kiến trúc Đề xuất
- **Minecraft Server**: Cài đặt plugin RCON để lắng nghe lệnh điều khiển từ xa, hoặc cài đặt một plugin API Custom (như một web server nội bộ).
- **Backend (Worker)**: Lưu trữ bảng mapping giữa `Discord_ID` và `Minecraft_Username`. Thực hiện gửi lệnh RCON đến server Minecraft khi người dùng click nút "Nhận quà".
- **Database**: Cloudflare KV/D1 để lưu trạng thái nhận quà (Tránh nhận nhiều lần) và thông tin liên kết tài khoản.
