const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Store submitted form data
app.post('/submit-form', (req, res) => {
  const { firstName, lastName, email, phone, country, market } = req.body;

  if (!firstName || !lastName || !email || !country || !market) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const entry = {
    firstName,
    lastName,
    email,
    phone,
    country,
    market,
    timestamp: new Date().toISOString()
  };

  const filePath = path.join(__dirname, 'form_submissions.txt');
  const dataLine = JSON.stringify(entry) + '\n';

  fs.appendFile(filePath, dataLine, (err) => {
    if (err) {
      console.error('Error saving form data:', err);
      return res.status(500).json({ error: 'Failed to save form data' });
    }
    res.json({ success: true });
  });
});

// Upload CV file
app.post('/upload', upload.single('cv'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send('File uploaded successfully!');
});

// Admin page to view submissions and downloads
app.get('/submissions', (req, res) => {
  const filePath = path.join(__dirname, 'form_submissions.txt');
  const uploadDir = path.join(__dirname, 'uploads');

  if (!fs.existsSync(filePath)) {
    return res.send('<p>No submissions found.</p>');
  }

  const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
  const data = lines.map(line => JSON.parse(line));

  let html = \`
    <html>
      <head>
        <title>CV Submissions</title>
        <style>
          body { font-family: Arial, sans-serif; background: #111; color: #eee; padding: 40px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; border: 1px solid #444; }
          th { background: #222; }
          a { color: #66f; }
        </style>
      </head>
      <body>
        <h2>Uploaded CVs & User Info</h2>
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Country</th>
              <th>Market</th>
              <th>Resume</th>
            </tr>
          </thead>
          <tbody>
  \`;

  data.forEach((entry, index) => {
    const files = fs.readdirSync(uploadDir);
    const latestFile = files[files.length - 1 - index] || "N/A";
    const filePath = '/uploads/' + latestFile;

    html += \`
      <tr>
        <td>\${entry.firstName} \${entry.lastName}</td>
        <td>\${entry.email}</td>
        <td>\${entry.phone || ''}</td>
        <td>\${entry.country}</td>
        <td>\${entry.market}</td>
        <td><a href="\${filePath}" download>Download</a></td>
      </tr>
    \`;
  });

  html += \`
          </tbody>
        </table>
      </body>
    </html>
  \`;

  res.send(html);
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:\${port}`);
});
