# 🛡️ Hướng dẫn Khôi phục & Quản lý Backup cho AI Agent (OlongBell Changelogs Web)

> [!IMPORTANT]
> **Dành cho các AI Agent tương lai hoặc khi người dùng di chuyển dự án sang thiết bị khác:**
> Tài liệu này hướng dẫn cách khôi phục lại toàn bộ trạng thái hoạt động tốt nhất của dự án từ thư mục `backup_state/`.

---

## 📂 1. Cấu trúc thư mục Backup (`backup_state/`)
Thư mục `backup_state/` lưu trữ phiên bản ổn định nhất của dự án bao gồm:
- **`index.html`**: File cấu trúc giao diện chính (chứa Loading Screen, Navbar + Discord Auth Panel, Hero 3D cylinder, Sneak Peeks so le 1:1, Vote Section Coming Soon và Footer).
- **`styles/`**: Thư mục CSS chính chứa giao diện tối, sáng, hiệu ứng hạt bụi tinh tú, và bố cục so le.
- **`scripts/`**: Chứa toàn bộ logic Javascript (GSAP 3D, Auth Discord, Thả tim Changelogs, Custom Cursor).
- **`assets/`**: Chứa các file ảnh tĩnh và động (như `fubuki_walk.gif` không nền).

---

## 🔄 2. Hướng dẫn khôi phục (Restore Instructions)

Nếu mã nguồn ở thư mục gốc bị lỗi, xung đột hoặc khi người dùng mở workspace này trên một thiết bị mới hoàn toàn và các file gốc bị thiếu, hãy chạy lệnh sau để phục hồi trạng thái ổn định:

### Sử dụng PowerShell (Windows)
Mở terminal tại thư mục gốc của dự án (`C:\Users\giath\minecraft-changelogs-web`) và chạy lệnh:
```powershell
Copy-Item -Path "backup_state\*" -Destination "." -Recurse -Force
```

### Sử dụng Bash (Linux/macOS)
```bash
cp -r backup_state/* .
```

---

## 🛠️ 3. Sơ đồ Kiến trúc & Phân nhiệm của các file scripts
Khi tiếp quản dự án này, Agent cần lưu ý vai trò của các file sau:
1. **app.js**: Điểm khởi đầu khởi tạo lớp điều khiển chính.
2. **auth.js**: Xử lý Đăng nhập/Đăng xuất Discord OAuth2 (Implicit Flow), lưu trữ Local Storage Mock DB. Có thể bật backend toàn cầu bằng cách điền `BACKEND_URL`.
3. **changelogs-data.js**: Lưu trữ mảng dữ liệu tĩnh `CHANGELOGS_DATA` và `SNEAKPEEKS_DATA`. Chỉnh sửa thông tin hình ảnh/video/mô tả trực tiếp tại đây.
4. **ui-interactions.js**: Xử lý hiển thị tin Changelog, thả cảm xúc Reactions, render các tin Sneak Peeks dạng so le 1:1 và Lazy-load video YouTube.
5. **gsap-carousel.js**: Công cụ dựng khối 3D Cylinder quay tròn cho Changelogs bằng GSAP ScrollTrigger.
6. **cursor-effect.js**: Canvas dựng hiệu ứng mạng lưới Constellation nối các đốm sáng đi theo con trỏ chuột.
7. **hero-interactions.js**: Xử lý Loading Screen, chuyển đổi theme sáng/tối và nút CTA có từ tính (Magnetic).
8. **lenis-smooth-scroll.js**: Đã tắt Lenis để chống giật lag, hiện tại chỉ chứa logic điều khiển thanh chữ chạy ngang (Marquee) đảo chiều khi cuộn.
