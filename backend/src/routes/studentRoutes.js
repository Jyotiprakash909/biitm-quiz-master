const express = require('express');
const router = express.Router();
const {
  verifyStudent,
  registerStudent,
  getExamData,
  submitExam,
  getResult
} = require('../controllers/studentController');

router.post('/verify', verifyStudent);
router.post('/register', registerStudent);
router.get('/exam-data/:examId', getExamData);
router.post('/submit/:examId', submitExam);
router.get('/result/:examId', getResult);

module.exports = router;
