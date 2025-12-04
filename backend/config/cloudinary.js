// Cau hinh Cloudinary
const cloudinary = require('cloudinary').v2;

// Khoi tao Cloudinary voi thong tin tu bien moi truong
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Kiem tra cau hinh
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️  Canh bao: Thieu thong tin cau hinh Cloudinary trong file .env');
}

module.exports = cloudinary;
