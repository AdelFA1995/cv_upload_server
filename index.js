const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
const FORM_DATA_FILE = path.join(__dirname, 'form_submissions.txt');

// Make sure the uploads folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Make sure the submissions file exists
if (!fs.existsSync(FORM_DATA_FILE)) {
  fs.writeFileSync(FORM_DATA_FILE, '');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// Root check
app.get('/', (req, res) => {
  res.send('CV Upload Server is running...');
});

// Handle form data
app.post('/save-user-data', (req, res) => {
  const { firstName, lastName, email, phone, country, market } = req.body;

  if (!firstName || !lastName || !email || !country || !market) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const line = `${Date.now()} | ${firstName} ${lastName} | ${email} | ${phone || 'N/A'} | ${country} | ${market}\n`;
  fs.appendFile(FORM_DATA_FILE, line, (err) => {
    if (err) {
      console.error('Error saving user data:', err.message);
      return res.status(500).json({ error: 'Failed to save user data' });
    }
    res.json({ success: true });
  });
});

// Upload route
app.post('/upload', upload.single('cv'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send('File uploaded successfully!');
});

// View uploaded files (JSON)
app.get('/files', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Cannot read upload directory' });
    }
    const data = files.map(file => ({
      name: file,
      url: `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'cv-upload-server.onrender.com'}/uploads/${file}`
    }));
    res.json(data);
  });
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
