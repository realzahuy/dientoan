# AES-256 File Encryption Web App

Web mã hóa/giải mã file bằng AES-256-GCM với quản lý tài khoản và lưu trữ trên Cloudinary.

## Tính năng

- 🔐 Mã hóa AES-256-GCM an toàn tuyệt đối
- 👤 Đăng ký/đăng nhập với JWT
- 📁 Upload, quản lý file đã mã hóa
- ☁️ Lưu trữ file trên Cloudinary (không tốn disk server)
- 🔧 Tool encrypt/decrypt nhanh (không cần đăng nhập)
- 🎨 Giao diện hiện đại, responsive

## Công nghệ

Node.js + Express + MySQL + Cloudinary + AES-256-GCM + JWT

## Cài đặt nhanh

### 1. Cài dependencies
```bash
cd backend
npm install
```

### 2. Tạo database MySQL
```bash
mysql -u root -p < backend/database.sql
```

### 3. Cấu hình Cloudinary

- Đăng ký miễn phí tại: https://cloudinary.com/
- Vào Dashboard → lấy **Cloud Name**, **API Key**, **API Secret**

### 4. Cấu hình .env

Sửa file `backend/.env`:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=file_encryption_db

# Security
JWT_SECRET=your_random_secret_string_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 5. Chạy server
```bash
npm start
```

Truy cập: http://localhost:5000

## Cách sử dụng

### Không cần đăng nhập

1. Vào trang chủ → Click "Công cụ Encrypt/Decrypt nhanh"
2. Chọn file + nhập mật khẩu → Mã hóa/Giải mã
3. File tải xuống ngay lập tức

### Có tài khoản

1. **Đăng ký**: Email + mật khẩu (tối thiểu 8 ký tự, có chữ hoa, thường, số)
2. **Đăng nhập**: Vào dashboard
3. **Dashboard có 3 phần**:
   - **My Files**: Xem, tải, xóa file đã upload
   - **Encrypt & Upload**: Upload file mới (lưu trên Cloudinary)
   - **Tool Encrypt/Decrypt**: Mã hóa/giải mã nhanh

### Upload file
- Chọn file → Nhập mật khẩu mã hóa → Upload
- File được mã hóa AES-256-GCM trước khi lên Cloudinary
- Lưu URL vào database

### Download file
- Click "Tải xuống" → Nhập mật khẩu mã hóa
- Tải file từ Cloudinary → Giải mã → Download

### Xóa file
- Click "Xóa" → Nhập mật khẩu tài khoản
- Xóa file trên Cloudinary + database

## Cloudinary

### Tại sao dùng Cloudinary?

✅ Không tốn disk server  
✅ Dễ scale khi nhiều user  
✅ Backup tự động  
✅ CDN nhanh toàn cầu  
✅ Sẵn sàng production  

### Bảo mật

- File được **mã hóa trước** khi upload
- Cloudinary chỉ lưu file đã mã hóa (binary)
- Không ai đọc được nội dung
- Cần mật khẩu để giải mã

### File lưu ở đâu?

- Folder trên Cloudinary: `encrypted_files/`
- Format: `encrypted_files/{user_id}_{uuid}`

## Troubleshooting

### "Thiếu thông tin Cloudinary"
→ Kiểm tra `.env` có đủ 3 biến: CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET

### "Upload failed"
→ Kiểm tra credentials, quota (Free: 25 credits/tháng), internet

### "Download failed"
→ Kiểm tra file còn tồn tại trên Cloudinary Dashboard

## API Endpoints

**Public:**
- `POST /api/register` - Đăng ký
- `POST /api/login` - Đăng nhập
- `POST /tool/encrypt` - Mã hóa (không cần login)
- `POST /tool/decrypt` - Giải mã (không cần login)

**Protected (cần JWT):**
- `GET /api/me` - Thông tin user
- `POST /api/upload` - Upload file
- `GET /api/files` - Danh sách file
- `POST /api/download/:id` - Download file
- `POST /api/delete/:id` - Xóa file

## Migration từ phiên bản cũ

Nếu có project cũ dùng folder `uploads/`:

1. Backup: `mysqldump -u root -p file_encryption_db > backup.sql`
2. Update DB: `ALTER TABLE files ADD COLUMN cloudinary_url TEXT;`
3. Cài lại: `npm install`
4. Cấu hình Cloudinary trong `.env`
5. Chạy lại server

## Lưu ý

- Free tier Cloudinary: 25 credits/tháng (đủ cho dev)
- Đổi JWT_SECRET trước khi deploy
- Backup database thường xuyên
- File lưu trong folder `encrypted_files/` trên Cloudinary

## License

MIT
