const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const FORM_DATA_FILE = path.join(__dirname, 'form_submissions.txt');

app.get('/', (req, res) => {
  res.send('CV Upload Server is running...');
});

app.post('/upload', upload.single('cv'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send('No file uploaded');

  const { firstName, lastName, email, phone, country, market } = req.body;
  if (!firstName || !lastName || !email || !country || !market) {
    return res.status(400).send('Missing user info');
  }

  const userData = [firstName, lastName, email, phone, country, market, file.filename].join(',') + '\n';
  fs.appendFile(FORM_DATA_FILE, userData, (err) => {
    if (err) return res.status(500).send('Failed to save user data');
    res.status(200).send('File uploaded successfully!');
  });
});

app.get('/files', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) return res.json([]);

  const files = fs.readdirSync(uploadDir).map(filename => ({
    name: filename,
    url: `https://cv-upload-server.onrender.com/uploads/${filename}`
  }));

  res.json(files);
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/dashboard', (req, res) => {
  const dataFile = path.join(__dirname, 'form_submissions.txt');
  if (!fs.existsSync(dataFile)) {
    return res.send('<h2 style="color:white; text-align:center;">No submissions yet.</h2>');
  }

  const rows = fs.readFileSync(dataFile, 'utf8')
    .trim()
    .split('\n')
    .map(line => {
      const [first, last, email, phone, country, market, filename] = line.split(',');
      const fileUrl = `https://cv-upload-server.onrender.com/uploads/${filename}`;
      return `
        <tr>
          <td>${first}</td>
          <td>${last}</td>
          <td>${email}</td>
          <td>${phone || '-'}</td>
          <td>${country}</td>
          <td>${market}</td>
          <td><a href="${fileUrl}" target="_blank">Download</a></td>
        </tr>
      `;
    }).join('');

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>CV Submissions</title>
      <style>
        body { background: #111; color: #fff; font-family: 'Segoe UI', sans-serif; padding: 40px; }
        table { width: 100%; border-collapse: collapse; background: #1a1a1a; border-radius: 10px; overflow: hidden; }
        th, td { padding: 15px; border-bottom: 1px solid #333; text-align: left; }
        th { background: #222; color: #ff00aa; }
        tr:hover { background-color: #2c2c2c; }
        a { color: #00ffff; text-decoration: none; font-weight: bold; }
        a:hover { text-decoration: underline; }
        h1 { color: #fff; text-align: center; margin-bottom: 30px; }
      </style>
    </head>
    <body>
      <h1>📥 CV Submissions</h1>
      <table>
        <thead>
          <tr>
            <th>First Name</th><th>Last Name</th><th>Email</th><th>Phone</th><th>Country</th><th>Market</th><th>CV File</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
  </html>
  `;

  res.send(html);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
