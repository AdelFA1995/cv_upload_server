const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

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

const FORM_DB = path.join(__dirname, 'form_submissions.txt');

app.post('/submit-form', (req, res) => {
  const { firstName, lastName, email, phone, country, market } = req.body;
  const line = `${Date.now()},${firstName},${lastName},${email},${phone},${country},${market}
`;
  try {
    fs.appendFileSync(FORM_DB, line);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not save form data.' });
  }
});

app.post('/upload', upload.single('cv'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  res.send('File uploaded successfully!');
});

app.get('/files', (req, res) => {
  const uploadPath = path.join(__dirname, 'uploads');
  fs.readdir(uploadPath, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to list files' });
    const result = files.map(f => ({
      name: f,
      url: `${req.protocol}://${req.get('host')}/uploads/${f}`
    }));
    res.json(result);
  });
});

app.get('/', (req, res) => {
  res.send('CV Upload Server is running...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
