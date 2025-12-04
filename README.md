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

### 3. Cấu hình Cloudinary

#### Bước 3.1: Tạo tài khoản Cloudinary

1. Truy cập: https://cloudinary.com/
2. Đăng ký tài khoản miễn phí
3. Xác nhận email

#### Bước 3.2: Lấy thông tin API

1. Đăng nhập vào Cloudinary Dashboard
2. Vào mục **Dashboard** (trang chủ sau khi đăng nhập)
3. Tìm phần **Account Details** hoặc **API Keys**
4. Sao chép các thông tin sau:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 4. Cấu hình file .env

Chỉnh sửa file `backend/.env` với thông tin của bạn:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=file_encryption_db
JWT_SECRET=your_jwt_secret_change_this_to_random_string

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Lưu ý**: 
- Thay đổi `JWT_SECRET` thành một chuỗi ngẫu nhiên dài để bảo mật
- Điền đầy đủ thông tin Cloudinary để upload file lên cloud

### 5. Chạy server

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

## Thay đổi quan trọng: Upload lên Cloudinary

**Phiên bản mới này upload file trực tiếp lên Cloudinary thay vì lưu local:**

- ✅ File được mã hóa AES-256-GCM trước khi upload
- ✅ Upload lên Cloudinary cloud storage
- ✅ Không cần folder `uploads/` trên server
- ✅ Trả về URL từ Cloudinary
- ✅ Download file từ Cloudinary khi cần

**Lợi ích:**
- Tiết kiệm dung lượng server
- Dễ dàng scale và deploy
- Backup tự động trên cloud
- Truy cập nhanh từ CDN

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

## Test API với curl

### Upload file:
```bash
# Đăng nhập
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}' \
  -c cookies.txt

# Upload file
curl -X POST http://localhost:5000/api/upload \
  -F "file=@/path/to/file.txt" \
  -F "encryptionPassword=mypass123" \
  -b cookies.txt
```

### Response mẫu:
```json
{
  "success": true,
  "message": "Upload và mã hóa thành công",
  "data": {
    "public_id": "encrypted_files/1_abc123",
    "url": "https://res.cloudinary.com/.../encrypted_files/1_abc123",
    "original_filename": "file.txt"
  }
}
```

## Cloudinary Integration

### Tại sao dùng Cloudinary?

Thay vì lưu file mã hóa trong folder `uploads/` trên server, project này upload trực tiếp lên Cloudinary cloud storage:

**Lợi ích:**
- ✅ Không tốn dung lượng disk server
- ✅ Dễ dàng scale khi có nhiều user
- ✅ Backup tự động trên cloud
- ✅ CDN delivery nhanh toàn cầu
- ✅ Sẵn sàng cho production deploy

**Bảo mật:**
- File được mã hóa AES-256-GCM **trước** khi upload
- Cloudinary chỉ lưu file đã mã hóa (binary)
- Không ai đọc được nội dung file trên Cloudinary
- Cần mật khẩu giải mã để download

### Cách hoạt động

1. **Upload**: File → Mã hóa AES-256-GCM → Upload lên Cloudinary → Lưu URL vào DB
2. **Download**: Lấy URL từ DB → Tải file từ Cloudinary → Giải mã → Trả về user
3. **Delete**: Xóa file trên Cloudinary + Xóa record trong DB

### Troubleshooting

#### Lỗi: "Thiếu thông tin cấu hình Cloudinary"

**Nguyên nhân:** Chưa set biến môi trường trong `.env`

**Giải pháp:**
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Lỗi: "Upload failed"

**Nguyên nhân:** Sai API credentials hoặc hết quota

**Giải pháp:**
- Kiểm tra lại credentials trên Cloudinary Dashboard
- Kiểm tra quota (Free tier: 25 credits/month)
- Kiểm tra kết nối internet

#### Lỗi: "Download failed"

**Nguyên nhân:** URL không hợp lệ hoặc file đã bị xóa

**Giải pháp:**
- Kiểm tra `cloudinary_url` trong database
- Kiểm tra file còn tồn tại trên Cloudinary Dashboard

### Migration từ phiên bản cũ

Nếu bạn đang có project cũ dùng folder `uploads/`:

#### Bước 1: Backup dữ liệu
```bash
cp -r backend/uploads backend/uploads_backup
mysqldump -u root -p file_encryption_db > backup.sql
```

#### Bước 2: Cập nhật database
```sql
ALTER TABLE files ADD COLUMN cloudinary_url TEXT AFTER stored_name;
```

#### Bước 3: Cài đặt dependencies mới
```bash
cd backend
npm install
```

#### Bước 4: Cấu hình Cloudinary trong .env

#### Bước 5: (Optional) Migrate file cũ lên Cloudinary

Tạo file `migrate-to-cloudinary.js`:

```javascript
require('dotenv').config();
const cloudinary = require('./config/cloudinary');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function migrate() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [files] = await db.query('SELECT * FROM files WHERE cloudinary_url IS NULL');
  
  for (const file of files) {
    try {
      const filePath = path.join('uploads', file.stored_name);
      const fileBuffer = await fs.readFile(filePath);
      
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            folder: 'encrypted_files',
            public_id: file.stored_name.replace('.enc', '')
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(fileBuffer);
      });
      
      await db.query(
        'UPDATE files SET cloudinary_url = ? WHERE id = ?',
        [result.secure_url, file.id]
      );
      
      console.log(`✓ Migrated: ${file.original_name}`);
    } catch (error) {
      console.error(`✗ Failed: ${file.original_name}`, error.message);
    }
  }
  
  await db.end();
  console.log('Migration complete!');
}

migrate();
```

Chạy migration:
```bash
node migrate-to-cloudinary.js
```

## Lưu ý

- File được mã hóa AES-256-GCM trước khi upload lên Cloudinary
- Cloudinary lưu file dạng raw (binary) trong folder `encrypted_files/`
- Không cần folder `backend/uploads/` nữa
- Đảm bảo backup database thường xuyên
- Thay đổi JWT_SECRET và Cloudinary credentials trước khi deploy
- Free tier Cloudinary: 25 credits/month (đủ cho development)

## License

MIT
