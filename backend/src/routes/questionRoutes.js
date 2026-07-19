const express = require('express');
const router = express.Router({ mergeParams: true }); // Important to get examId from parent route
const {
  addQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  bulkAddQuestions,
  bulkDeleteQuestions,
  reorderQuestions
} = require('../controllers/questionController');
const { protectAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for temp upload
const uploadDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `upload-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });

router.route('/')
  .post(protectAdmin, addQuestion)
  .get(protectAdmin, getQuestions);

router.post('/bulk', protectAdmin, upload.single('file'), bulkAddQuestions);
router.post('/bulk-delete', protectAdmin, bulkDeleteQuestions);
router.put('/reorder', protectAdmin, reorderQuestions);

router.route('/:id')
  .put(protectAdmin, updateQuestion)
  .delete(protectAdmin, deleteQuestion);

module.exports = router;
