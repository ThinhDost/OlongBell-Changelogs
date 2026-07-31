# 🔗 Phase 1: User Verification & Linking System

Giai đoạn đầu tiên tập trung vào việc tạo cầu nối liên kết danh tính giữa tài khoản Discord và tài khoản Minecraft một cách an toàn, tránh mạo danh.

## 📋 Checklist Triển khai
- [ ] Thiết kế giao diện "Liên kết tài khoản Minecraft" trên trang cá nhân của user.
- [ ] Triển khai cơ chế xác thực chéo (Cross-Verification) chống mạo danh:
  - **Bước 1**: Người chơi nhập tên Minecraft trên Web. Hệ thống tạo ra mã PIN 6 số và lưu vào KV với thời gian hết hạn (TTL) là 5 phút.
  - **Bước 2**: Người chơi vào game gõ lệnh `/link <code>` (thông qua plugin Skript/Java Custom). Server Minecraft sẽ gọi API Worker để kiểm tra mã PIN.
- [ ] Định nghĩa biến môi trường `MINECRAFT_SERVER_TOKEN` (API Key dùng để xác thực các request gửi từ máy chủ Minecraft đến Cloudflare Worker).
- [ ] Tạo bảng KV/D1 `linked_accounts` lưu trữ thông tin liên kết hai chiều.

## 🛡️ Bản vá Bảo mật & Tối ưu (Security Fixes)
1. **Chống giả mạo API liên kết (API Spoofing):** Endpoint xác minh mã PIN `/api/link/verify` (được gọi từ server Minecraft) **bắt buộc** phải yêu cầu API Key trong header (ví dụ: `X-Server-Token: <MINECRAFT_SERVER_TOKEN>`). Nếu không có xác thực này, kẻ xấu có thể giả lập request để liên kết bừa bãi tài khoản của người chơi khác với Discord của họ.
2. **Kiểm soát định dạng tên Minecraft (Input Validation):** Tên người chơi Minecraft luôn tuân theo quy tắc nhất định. Backend **bắt buộc** phải kiểm tra tên nhập vào bằng Regex:
   ```javascript
   const mcRegex = /^[a-zA-Z0-9_]{2,16}$/;
   if (!mcRegex.test(username)) {
       return new Response("Invalid Username Format", { status: 400 });
   }
   ```
   Điều này ngăn chặn mọi nguy cơ chèn mã độc (Command/SQL Injection) ngay từ lớp ngoài cùng.
