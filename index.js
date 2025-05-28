const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static('public')); // اگه لازم شد فایل HTML جداگانه داشته باشی
app.use('/uploads', express.static('uploads')); // فایل‌های آپلود شده قابل مشاهده بشن

// مسیر ذخیره فایل‌ها
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E6) + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// روت اصلی فقط تست سروره
app.get('/', (req, res) => {
  res.send('✅ CV Upload Server is running...');
});

// روت آپلود
app.post('/upload', upload.single('cv'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('❌ No file uploaded');
  }
  res.send('✅ File uploaded successfully!');
});

// ران کردن سرور
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
