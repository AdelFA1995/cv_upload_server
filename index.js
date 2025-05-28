const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));
app.use(express.static('public')); // برای صفحات thank-you یا all-data.html

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ذخیره‌سازی فایل
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.send('✅ CV Upload Server is running...');
});

app.post('/upload', upload.single('cv'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  res.status(200).json({ filename: req.file.filename });
});

app.post('/save-user', (req, res) => {
  const { firstName, lastName, email, phone, country, market, filename } = req.body;

  if (!firstName || !lastName || !email || !country || !market || !filename) {
    return res.status(400).send('Missing fields');
  }

  const line = `${Date.now()},${firstName},${lastName},${email},${phone || ''},${country},${market},${filename}\n`;

  fs.appendFile('form_submissions.txt', line, (err) => {
    if (err) {
      console.error('❌ Error saving user data:', err);
      return res.status(500).send('Failed to save');
    }
    res.send('Saved');
  });
});

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

app.get('/user-data', (req, res) => {
  const filePath = path.join(__dirname, 'form_submissions.txt');
  if (!fs.existsSync(filePath)) return res.json([]);

  const data = fs.readFileSync(filePath, 'utf-8').trim().split('\n').map((line) => {
    const [timestamp, firstName, lastName, email, phone, country, market, filename] = line.split(',');
    return { timestamp, firstName, lastName, email, phone, country, market, filename };
  });

  res.json(data.reverse());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
