const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));
app.use(express.static('public')); // برای فایل‌های HTML مثل thank-you.html و all-data.html

// پوشه آپلود فایل‌ها
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

// تنظیمات multer برای ذخیره فایل‌ها
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
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

// روت ترکیبی آپلود فایل + ذخیره اطلاعات کاربر
app.post('/submit', upload.single('cv'), (req, res) => {
  const { firstName, lastName, email, phone, country, market } = req.body;

  if (!req.file || !firstName || !lastName || !email || !country || !market) {
    return res.status(400).send('Missing fields or file');
  }

  const timestamp = Date.now();
  const fileName = `${timestamp}-${req.file.originalname.replace(/\s+/g, '_')}`;
  const newPath = path.join(uploadPath, fileName);

  // تغییر نام فایل
  fs.renameSync(req.file.path, newPath);

  // ذخیره اطلاعات به همراه نام فایل
  const line = `${timestamp},${firstName},${lastName},${email},${phone || ''},${country},${market},${fileName}\n`;
  fs.appendFileSync('form_submissions.txt', line);

  res.status(200).send('Saved & Uploaded');
});

// نمایش فایل‌ها به صورت لیست
app.get('/files', (req, res) => {
  fs.readdir(uploadPath, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to read uploads' });

    const fileList = files.map(name => ({
      name,
      url: `https://cv-upload-server.onrender.com/uploads/${name}`
    }));
    res.json(fileList);
  });
});

// نمایش اطلاعات کاربران + فایل رزومه
app.get('/user-data', (req, res) => {
  const filePath = path.join(__dirname, 'form_submissions.txt');
  if (!fs.existsSync(filePath)) return res.json([]);

  const data = fs.readFileSync(filePath, 'utf-8').trim().split('\n').map((line) => {
    const [timestamp, firstName, lastName, email, phone, country, market, fileName] = line.split(',');
    return {
      timestamp,
      firstName,
      lastName,
      email,
      phone,
      country,
      market,
      fileName,
      fileUrl: `https://cv-upload-server.onrender.com/uploads/${fileName}`
    };
  });

  res.json(data.reverse());
});

// اجرای سرور
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
