const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protectAdmin } = require('../middleware/authMiddleware');

const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Use memory storage for Base64 conversion
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit for Base64 storage
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

router.get('/', getSettings);
router.put('/', protectAdmin, updateSettings);
router.post('/upload-logo', protectAdmin, upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  // Convert buffer to Base64
  const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  
  res.json({ url: base64Image });
});

module.exports = router;
