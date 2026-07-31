# 👥 Phase 2: Interactive Online Players Grid

Cải thiện giao diện hiển thị danh sách người chơi đang online, tạo ra một lưới hình ảnh (Grid) sinh động chứa avatar 3D hoặc skin toàn thân của họ.

## 📋 Checklist Triển khai
- [ ] Thiết kế khu vực "Thành viên đang online" bên dưới Hero Section hoặc trong một Sidebar.
- [ ] Tích hợp API vẽ skin 3D từ UUID/Tên người chơi (sử dụng dịch vụ như `crafatar.com` hoặc `minotar.net` để lấy ảnh đầu hoặc skin đầy đủ).
- [ ] Xây dựng hiệu ứng hover mượt mà: khi rê chuột vào skin của ai đó sẽ hiện lên một thẻ thông tin nhỏ (Popup Card) hiển thị:
  - Tên người chơi
  - Thời gian đã chơi (nếu đồng bộ được từ DB)
  - Huy chương/Rank danh vọng
- [ ] Tối ưu hóa hiệu năng render: chỉ hiển thị tối đa 20-30 người chơi hoạt động nhiều nhất để tránh làm nặng trình duyệt.

## 🛠️ Chi tiết kỹ thuật
Sử dụng thẻ `img` với URL động:
`https://crafatar.com/avatars/{uuid}?size=64&overlay` để tự động render đầu nhân vật kèm theo lớp mũ/tóc 3D cực kỳ đẹp mắt của Minecraft.
