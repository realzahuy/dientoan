require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('./config/cloudinary');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../frontend'))); // Serve static files từ thư mục frontend

// Cấu hình multer để upload file
const storage = multer.memoryStorage(); // Lưu file trong memory để xử lý
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // Giới hạn 100MB
});

// Kết nối MySQL
let db;
async function connectDB() {
  db = await mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
  });
  console.log('✓ Đã kết nối MySQL');
}

// Middleware xác thực JWT
function authenticateToken(req, res, next) {
  let token = null;
  
  // Ưu tiên 1: Đọc từ cookie (web browser)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Ưu tiên 2: Đọc từ header Authorization (Postman, mobile app)
  else if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    token = authHeader.startsWith('Bearer ') 
      ? authHeader.split(' ')[1]  // "Bearer abc123" → "abc123"
      : authHeader;                // "abc123" → "abc123"
  }
  
  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    req.user = user;
    next();
  });
}

// ============ CRYPTO HELPERS ============

// Derive key từ password bằng PBKDF2
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

// Mã hóa file bằng AES-256-GCM
function encryptFile(buffer, password) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(password, salt);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return { encrypted, salt, iv, authTag };
}

// Giải mã file bằng AES-256-GCM
function decryptFile(encrypted, password, salt, iv, authTag) {
  const key = deriveKey(password, salt);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  try {
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted;
  } catch (error) {
    throw new Error('Mật khẩu giải mã sai hoặc file đã bị thay đổi');
  }
}

// ============ AUTH ROUTES ============

// Đăng ký
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    
    // Validation
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }
    
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Mật khẩu phải có chữ hoa, chữ thường và số' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Mật khẩu xác nhận không khớp' });
    }
    
    // Kiểm tra email đã tồn tại
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }
    
    // Hash password và lưu
    const passwordHash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, passwordHash]);
    
    res.json({ message: 'Đăng ký thành công' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Đăng nhập
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }
    
    // Tìm user
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    
    const user = users[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    
    // Tạo JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Lưu trong HTTP-only cookie (cho web browser)
    res.cookie('token', token, { 
      httpOnly: true, 
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      domain: process.env.COOKIE_DOMAIN || undefined,
      path: '/'
    });
    
    // Trả token trong response (cho Postman/mobile app)
    res.json({ 
      message: 'Đăng nhập thành công',
      token: token  // ← Thêm token vào response
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Đăng xuất
app.post('/api/logout', (req, res) => {
  res.clearCookie('token', {
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/'
  });
  res.json({ message: 'Đã đăng xuất' });
});

// Lấy thông tin user hiện tại
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, email FROM users WHERE id = ?', [req.user.userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User không tồn tại' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ FILE MANAGEMENT ROUTES (Cần đăng nhập) ============

// Upload và mã hóa file
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { encryptionPassword } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn file' });
    }
    
    if (!encryptionPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập mật khẩu mã hóa' });
    }
    
    // Mã hóa file
    const { encrypted, salt, iv, authTag } = encryptFile(req.file.buffer, encryptionPassword);
    
    // Upload file mã hóa lên Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'encrypted_files',
          public_id: `${req.user.userId}_${uuidv4()}`,
          use_filename: false
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      // Ghi buffer vào stream
      uploadStream.end(encrypted);
    });
    
    // Lưu metadata vào DB (lưu public_id và secure_url từ Cloudinary)
    await db.query(
      'INSERT INTO files (user_id, original_name, stored_name, cloudinary_url, size, salt, iv, auth_tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.userId, req.file.originalname, uploadResult.public_id, uploadResult.secure_url, req.file.size, salt, iv, authTag]
    );
    
    res.json({ 
      success: true,
      message: 'Upload và mã hóa thành công',
      data: {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url,
        original_filename: req.file.originalname
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi upload file',
      message: error.message 
    });
  }
});

// Lấy danh sách file của user
app.get('/api/files', authenticateToken, async (req, res) => {
  try {
    const [files] = await db.query(
      'SELECT id, original_name, size, created_at FROM files WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(files);
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách file' });
  }
});

// Download và giải mã file
app.post('/api/download/:id', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const fileId = req.params.id;
    
    if (!password) {
      return res.status(400).json({ error: 'Vui lòng nhập mật khẩu giải mã' });
    }
    
    // Lấy thông tin file
    const [files] = await db.query(
      'SELECT * FROM files WHERE id = ? AND user_id = ?',
      [fileId, req.user.userId]
    );
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'File không tồn tại' });
    }
    
    const file = files[0];
    
    // Tải file mã hóa từ Cloudinary
    const axios = require('axios');
    const response = await axios.get(file.cloudinary_url, { responseType: 'arraybuffer' });
    const encrypted = Buffer.from(response.data);
    
    // Giải mã
    try {
      const decrypted = decryptFile(encrypted, password, file.salt, file.iv, file.auth_tag);
      
      // Trả file về client
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(decrypted);
    } catch (decryptError) {
      return res.status(400).json({ error: decryptError.message });
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Lỗi khi tải file' });
  }
});

// Xóa file
app.post('/api/delete/:id', authenticateToken, async (req, res) => {
  try {
    const { accountPassword } = req.body;
    const fileId = req.params.id;
    
    if (!accountPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập mật khẩu tài khoản' });
    }
    
    // Verify mật khẩu tài khoản
    const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User không tồn tại' });
    }
    
    const validPassword = await bcrypt.compare(accountPassword, users[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Mật khẩu tài khoản không đúng' });
    }
    
    // Lấy thông tin file
    const [files] = await db.query(
      'SELECT stored_name FROM files WHERE id = ? AND user_id = ?',
      [fileId, req.user.userId]
    );
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'File không tồn tại' });
    }
    
    // Xóa file từ Cloudinary
    try {
      await cloudinary.uploader.destroy(files[0].stored_name, { resource_type: 'raw' });
    } catch (err) {
      console.error('Cloudinary delete error:', err);
    }
    
    // Xóa record trong DB
    await db.query('DELETE FROM files WHERE id = ?', [fileId]);
    
    res.json({ 
      success: true,
      message: 'Xóa file thành công' 
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi xóa file' 
    });
  }
});

// ============ PUBLIC TOOL ROUTES (Không cần đăng nhập) ============

// Tool Encrypt (public)
app.post('/tool/encrypt', upload.single('file'), async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn file' });
    }
    
    if (!password) {
      return res.status(400).json({ error: 'Vui lòng nhập mật khẩu' });
    }
    
    // Mã hóa file
    const { encrypted, salt, iv, authTag } = encryptFile(req.file.buffer, password);
    
    // Tạo file .enc với format: [magic(4)][version(1)][salt(16)][iv(12)][authTag(16)][ciphertext]
    const magic = Buffer.from('AES2'); // Magic bytes
    const version = Buffer.from([0x01]); // Version 1
    const encFile = Buffer.concat([magic, version, salt, iv, authTag, encrypted]);
    
    // Trả file về client
    const originalName = req.file.originalname;
    const encName = originalName + '.enc';
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(encName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(encFile);
  } catch (error) {
    console.error('Tool encrypt error:', error);
    res.status(500).json({ error: 'Lỗi khi mã hóa file' });
  }
});

// Tool Decrypt (public)
app.post('/tool/decrypt', upload.single('file'), async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn file' });
    }
    
    if (!password) {
      return res.status(400).json({ error: 'Vui lòng nhập mật khẩu' });
    }
    
    const buffer = req.file.buffer;
    
    // Kiểm tra format: magic(4) + version(1) + salt(16) + iv(12) + authTag(16) = 49 bytes header
    if (buffer.length < 49) {
      return res.status(400).json({ error: 'File không hợp lệ' });
    }
    
    const magic = buffer.slice(0, 4).toString();
    if (magic !== 'AES2') {
      return res.status(400).json({ error: 'File không phải là file mã hóa hợp lệ' });
    }
    
    const version = buffer[4];
    if (version !== 0x01) {
      return res.status(400).json({ error: 'Phiên bản file không được hỗ trợ' });
    }
    
    const salt = buffer.slice(5, 21);
    const iv = buffer.slice(21, 33);
    const authTag = buffer.slice(33, 49);
    const encrypted = buffer.slice(49);
    
    // Giải mã
    try {
      const decrypted = decryptFile(encrypted, password, salt, iv, authTag);
      
      // Trả file về client (bỏ .enc extension nếu có)
      let originalName = req.file.originalname;
      if (originalName.endsWith('.enc')) {
        originalName = originalName.slice(0, -4);
      }
      
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(decrypted);
    } catch (decryptError) {
      return res.status(400).json({ error: decryptError.message });
    }
  } catch (error) {
    console.error('Tool decrypt error:', error);
    res.status(500).json({ error: 'Lỗi khi giải mã file' });
  }
});

// Start server
connectDB().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`✓ Server đang chạy tại http://${HOST}:${PORT}`);
  });
}).catch(err => {
  console.error('Lỗi kết nối database:', err);
  process.exit(1);
});
