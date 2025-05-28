const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File Storage Setup
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
const upload = multer({ storage });

// Save Form Info
app.post('/submit-form', (req, res) => {
  const { firstName, lastName, email, phone, country, market } = req.body;

  if (!firstName || !lastName || !email || !country || !market) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const line = `${Date.now()},${firstName},${lastName},${email},${phone || ''},${country},${market}\n`;

  fs.appendFile('form_submissions.txt', line, err => {
    if (err) {
      console.error('❌ Error writing form:', err);
      return res.status(500).json({ error: 'Could not save form data' });
    }
    res.json({ success: true });
  });
});

// Upload File
app.post('/upload', upload.single('cv'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  res.send('File uploaded successfully!');
});

// View Uploaded Files with Download Button
app.get('/files', (req, res) => {
  const dirPath = path.join(__dirname, 'uploads');
  fs.readdir(dirPath, (err, files) => {
    if (err) return res.status(500).json({ error: 'Could not read upload directory' });

    const fileList = files.map(name => ({
      name,
      url: `https://${req.headers.host}/uploads/${name}`
    }));

    let html = `
      <html><head><title>Uploaded CVs</title>
      <style>
        body { font-family: Arial; background: #111; color: #eee; padding: 40px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; border: 1px solid #444; text-align: left; }
        a { color: #4dd0e1; text-decoration: none; }
      </style>
      </head><body>
        <h2>📄 Uploaded CVs</h2>
        <table>
          <tr><th>Filename</th><th>Download</th></tr>
          ${fileList.map(f => `<tr><td>${f.name}</td><td><a href="${f.url}" download>Download</a></td></tr>`).join('')}
        </table>
      </body></html>
    `;
    res.send(html);
  });
});

// Static Access
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root
app.get('/', (req, res) => {
  res.send('✅ CV Upload Server is running...');
});

// Listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
