const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ذخیره‌سازی فایل‌ها
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// مسیر آپلود
app.post('/upload', upload.single('cv'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  res.send('File uploaded successfully!');
});

// لیست فایل‌ها با دکمه دانلود
app.get('/files', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) return res.send('<h3>No files uploaded yet.</h3>');

  const files = fs.readdirSync(uploadDir);
  let html = `
    <html>
    <head>
      <title>Uploaded CVs</title>
      <style>
        body { background: #121212; color: #eee; font-family: 'Segoe UI', sans-serif; padding: 40px; }
        h1 { color: #fff; }
        .file-box { background: #1e1e1e; padding: 15px 20px; margin: 10px 0; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 0 10px rgba(255, 0, 128, 0.2); }
        .filename { font-weight: bold; }
        a.download-btn { background: linear-gradient(to right, #ff0066, #9900ff); padding: 8px 15px; color: white; border-radius: 6px; text-decoration: none; font-size: 14px; }
      </style>
    </head>
    <body>
      <h1>📁 Uploaded CVs</h1>
  `;

  files.forEach(file => {
    html += `
      <div class="file-box">
        <span class="filename">${file}</span>
        <a class="download-btn" href="/uploads/${file}" download>Download</a>
      </div>
    `;
  });

  html += `</body></html>`;
  res.send(html);
});

// مسیر تست اصلی
app.get('/', (req, res) => {
  res.send('CV Upload Server is running...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
