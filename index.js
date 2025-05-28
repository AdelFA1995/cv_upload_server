const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

// مسیر ذخیره فایل‌ها
const uploadFolder = path.join(__dirname, 'uploads');

// اگر پوشه وجود نداشت بسازش
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// تنظیمات Multer برای ذخیره فایل
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// endpoint برای آپلود فایل
app.post('/upload-cv', upload.single('cv'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({ message: 'CV uploaded successfully', filename: req.file.filename });
});

// اجرای سرور
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
