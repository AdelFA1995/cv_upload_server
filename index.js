const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// تنظیمات ذخیره فایل
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

// صفحه اصلی برای تست
app.get('/', (req, res) => {
  res.send('✅ CV Upload Server is running...');
});

// آپلود فایل رزومه
app.post('/upload', upload.single('cv'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  res.send('File uploaded successfully!');
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
      console.error('Failed to save user data:', err);
      return res.status(500).send('Failed to save');
    }
    res.send('Saved');
  });
});

// فقط لیست فایل‌ها
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

// ترکیب اطلاعات فایل و کاربر
app.get('/all-data', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads');
  const formFile = path.join(__dirname, 'form_submissions.txt');

  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to read uploads' });

    fs.readFile(formFile, 'utf8', (err, data) => {
      if (err) return res.status(500).json({ error: 'Failed to read form data' });

      const lines = data.trim().split('\n').reverse();
      const result = files.map((filename, index) => {
        const parts = lines[index]?.split(',') || [];
        return {
          name: filename,
          url: `https://cv-upload-server.onrender.com/uploads/${filename}`,
          timestamp: parts[0] || '',
          firstName: parts[1] || '',
          lastName: parts[2] || '',
          email: parts[3] || '',
          phone: parts[4] || '',
          country: parts[5] || '',
          market: parts[6] || ''
        };
      });
      res.json(result);
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
