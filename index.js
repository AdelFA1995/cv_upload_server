const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));
app.use(express.static('public')); // برای سرو فایل HTML مثل thank-you.html

// مسیر ثابت برای فایل‌ها
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ساخت مسیر ذخیره رزومه‌ها
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

// صفحه تست سرور
app.get('/', (req, res) => {
  res.send('✅ CV Upload Server is running...');
});

// آپلود فایل رزومه
app.post('/upload', upload.single('cv'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  res.status(200).send('Uploaded');
});

// ذخیره اطلاعات کاربر
app.post('/save-user', (req, res) => {
  const { firstName, lastName, email, phone, country, market } = req.body;

  if (!firstName || !lastName || !email || !country || !market) {
    return res.status(400).send('Missing fields');
  }

  const line = `${Date.now()},${firstName},${lastName},${email},${phone || ''},${country},${market}\n`;

  fs.appendFile('form_submissions.txt', line, (err) => {
    if (err) {
      console.error('❌ Error saving user data:', err);
      return res.status(500).send('Failed to save');
    }
    res.send('Saved');
  });
});

// نمایش لیست فایل‌ها
app.get('/files', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads');
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to read uploads' });

    const fileList = files.map(name => ({
      name,
      url: `https://cv-upload-server.onrender.com/uploads/${name}`
    }));
    res.json(fileList);
  });
});

// نمایش لیست اطلاعات کاربران (برای /all-data.html)
app.get('/user-data', (req, res) => {
  const filePath = path.join(__dirname, 'form_submissions.txt');
  if (!fs.existsSync(filePath)) return res.json([]);

  const data = fs.readFileSync(filePath, 'utf-8').trim().split('\n').map((line) => {
    const [timestamp, firstName, lastName, email, phone, country, market] = line.split(',');
    return { timestamp, firstName, lastName, email, phone, country, market };
  });

  res.json(data.reverse()); // آخرین کاربر اول باشه
});

// اجرای سرور
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
