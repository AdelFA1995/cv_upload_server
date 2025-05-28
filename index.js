const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Save form submissions
const userDataPath = path.join(__dirname, 'form_submissions.txt');

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

app.get('/', (req, res) => {
  res.send('CV Upload Server is running...');
});

app.post('/submit-form', (req, res) => {
  const { firstName, lastName, email, phone, country, market } = req.body;
  if (!firstName || !lastName || !email || !country || !market) {
    return res.status(400).send('Missing required fields');
  }

  const line = \`\${Date.now()},\${firstName},\${lastName},\${email},\${phone || ''},\${country},\${market}\n\`;
  fs.appendFileSync(userDataPath, line, 'utf8');
  res.sendStatus(200);
});

app.post('/upload', upload.single('cv'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  res.send('File uploaded successfully!');
});

app.get('/files', (req, res) => {
  const files = fs.readdirSync(path.join(__dirname, 'uploads'));
  const tableRows = files.map(name => {
    const url = \`/uploads/\${name}\`;
    return \`<tr>
      <td>\${name}</td>
      <td><a href="\${url}" download>Download</a></td>
    </tr>\`;
  }).join('');

  let userInfoTable = '';
  if (fs.existsSync(userDataPath)) {
    const rows = fs.readFileSync(userDataPath, 'utf8').trim().split('\n').map(line => {
      const [timestamp, fname, lname, email, phone, country, market] = line.split(',');
      return \`<tr>
        <td>\${fname} \${lname}</td>
        <td>\${email}</td>
        <td>\${phone}</td>
        <td>\${country}</td>
        <td>\${market}</td>
      </tr>\`;
    }).join('');
    userInfoTable = \`<h3>User Submissions</h3><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Country</th><th>Market</th></tr></thead><tbody>\${rows}</tbody></table>\`;
  }

  const html = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Uploaded Files</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #111; color: #eee; padding: 40px; }
    h2, h3 { color: #fff; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 40px; }
    th, td { padding: 12px; border: 1px solid #444; text-align: left; }
    a { color: #00f5d4; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h2>Uploaded CV Files</h2>
  <table>
    <thead><tr><th>Filename</th><th>Action</th></tr></thead>
    <tbody>\${tableRows}</tbody>
  </table>
  \${userInfoTable}
</body>
</html>\`;

  res.send(html);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});
