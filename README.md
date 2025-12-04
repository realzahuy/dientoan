# AES-256 File Encryption Web App

Web application mã hóa/giải mã file bằng AES-256-GCM với hệ thống quản lý tài khoản.

## Tính năng

- 🔐 **Mã hóa AES-256-GCM**: Chuẩn mã hóa an toàn tuyệt đối
- 👤 **Hệ thống tài khoản**: Đăng ký, đăng nhập với JWT authentication
- 📁 **Quản lý file**: Upload, mã hóa, lưu trữ và quản lý file đã mã hóa
- 🔧 **Công cụ nhanh**: Encrypt/Decrypt file không cần đăng nhập
- 🎨 **Giao diện hiện đại**: UI đẹp với gradient, card design, responsive

## Công nghệ sử dụng

- **Backend**: Node.js + Express
- **Database**: MySQL
- **Authentication**: JWT (HTTP-only cookie)
- **Encryption**: AES-256-GCM + PBKDF2
- **Frontend**: HTML/CSS/JavaScript (Vanilla)

## Cấu trúc dự án

```
├── backend/              # Backend Node.js + Express
│   ├── server.js        # Main server file
│   ├── package.json     # Dependencies
│   ├── .env             # Environment config
│   ├── database.sql     # MySQL schema
│   ├── start.bat        # Quick start script (Windows)
│   ├── uploads/         # Encrypted files storage
│   └── node_modules/    # Node packages
│
└── frontend/            # Frontend HTML/CSS/JS
    ├── index.html       # Landing page
    ├── login.html       # Login page
    ├── register.html    # Register page
    ├── dashboard.html   # Dashboard (after login)
    ├── tool.html        # Public encrypt/decrypt tool
    └── assets/
        └── style.css    # Styles
```

## Cài đặt

### 1. Cài đặt dependencies

```bash
cd backend
npm install
```

### 2. Tạo database MySQL

Chạy các lệnh SQL sau trong MySQL:

```sql
CREATE DATABASE file_encryption_db;
USE file_encryption_db;

-- Bảng users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng files
CREATE TABLE files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  salt BLOB NOT NULL,
  iv BLOB NOT NULL,
  auth_tag BLOB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

Hoặc import file SQL:
```bash
mysql -u root -p < backend/database.sql
```

### 3. Cấu hình file .env

Chỉnh sửa file `backend/.env` với thông tin MySQL của bạn:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=file_encryption_db
JWT_SECRET=your_jwt_secret_change_this_to_random_string
UPLOAD_DIR=uploads
```

**Lưu ý**: Thay đổi `JWT_SECRET` thành một chuỗi ngẫu nhiên dài để bảo mật.

### 4. Chạy server

```bash
cd backend
npm start
```

Hoặc trên Windows:
```bash
cd backend
start.bat
```

Server sẽ chạy tại: http://localhost:5000

## Hướng dẫn sử dụng

### Đối với người dùng chưa đăng nhập

1. Truy cập http://localhost:5000
2. Click "Công cụ Encrypt/Decrypt nhanh"
3. Chọn file và nhập mật khẩu để mã hóa/giải mã
4. File sẽ được tải xuống ngay lập tức

### Đối với người dùng có tài khoản

1. **Đăng ký**: Tạo tài khoản với email và mật khẩu (tối thiểu 8 ký tự, có chữ hoa, chữ thường và số)
2. **Đăng nhập**: Đăng nhập vào hệ thống
3. **Dashboard có 3 section**:
   - **My Files**: Xem danh sách file đã upload, tải xuống hoặc xóa
   - **Encrypt & Upload**: Upload file và nhập mật khẩu mã hóa để lưu trữ
   - **Tool Encrypt/Decrypt**: Công cụ mã hóa/giải mã nhanh (không lưu file)
4. **Download**: Click "Tải xuống", nhập mật khẩu mã hóa file để giải mã
5. **Delete**: Click "Xóa", nhập mật khẩu tài khoản để xác nhận xóa

## Bảo mật

- Mật khẩu tài khoản được hash bằng bcrypt (10 rounds)
- Mật khẩu mã hóa file được derive bằng PBKDF2 (100,000 iterations)
- JWT được lưu trong HTTP-only cookie
- File được mã hóa bằng AES-256-GCM với salt và IV ngẫu nhiên
- Auth tag đảm bảo tính toàn vẹn của file

## API Endpoints

### Public Routes
- `POST /api/register` - Đăng ký tài khoản
- `POST /api/login` - Đăng nhập
- `POST /api/logout` - Đăng xuất
- `POST /tool/encrypt` - Mã hóa file (không cần đăng nhập)
- `POST /tool/decrypt` - Giải mã file (không cần đăng nhập)

### Protected Routes (Cần JWT)
- `GET /api/me` - Lấy thông tin user hiện tại
- `POST /api/upload` - Upload và mã hóa file
- `GET /api/files` - Lấy danh sách file
- `POST /api/download/:id` - Download và giải mã file
- `POST /api/delete/:id` - Xóa file

## Lưu ý

- File mã hóa được lưu trong thư mục `backend/uploads/`
- Để deploy production, nên chuyển sang AWS S3 hoặc cloud storage khác
- Đảm bảo backup database thường xuyên
- Thay đổi JWT_SECRET trước khi deploy

## License

MIT
