const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json()); // برای دریافت JSON از فرانت‌اند

// مسیر ذخیره فایل‌های رزومه
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
const upload = multer({ storage });

// مسیر تستی
app.get('/', (req, res) => {
  res.send('CV Upload Server is running...');
});

// مسیر آپلود فایل
app.post('/upload', upload.single('cv'), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  res.send("File uploaded successfully!");
});

// 🚀 مسیر ذخیره اطلاعات فرم
app.post('/save-info', (req, res) => {
  const userData = req.body;

  // بررسی فیلدهای ضروری
  if (!userData.firstName || !userData.lastName || !userData.email || !userData.country || !userData.market) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const logPath = path.join(__dirname, 'form_submissions.txt');
  const logData = `${new Date().toISOString()} | ${JSON.stringify(userData)}\n`;

  fs.appendFile(logPath, logData, (err) => {
    if (err) {
      console.error("Save failed:", err);
      return res.status(500).json({ error: "Failed to save user info" });
    }
    res.json({ success: true });
  });
});

// نمایش فایل‌های آپلود شده
app.get('/files', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) return res.json([]);

  const files = fs.readdirSync(uploadDir).map(name => ({
    name,
    url: `https://${req.headers.host}/uploads/${name}`
  }));
  res.json(files);
});

// نمایش فایل‌ها
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
