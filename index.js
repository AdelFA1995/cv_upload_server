const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// مسیر ذخیره فایل‌ها
const upload = multer({ dest: 'uploads/' });

// مسیر ذخیره اطلاعات فرم
const FORM_DATA_PATH = './form-data.txt';

// آپلود فایل به همراه اطلاعات فرم
app.post('/upload', upload.single('cv'), (req, res) => {
  const { firstName, lastName, email, phone, country, market } = req.body;

  // ذخیره اطلاعات فرم در فایل متنی
  const formEntry = `${firstName},${lastName},${email},${phone},${country},${market}\n`;
  fs.appendFileSync(FORM_DATA_PATH, formEntry, 'utf8');

  res.send("✅ File and form data uploaded successfully!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
