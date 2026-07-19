const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/authMiddleware');
const {
  publishResult,
  exportExcel,
  exportStudentExcel,
  exportPdf,
  getAnalytics,
  getStudentReport
} = require('../controllers/resultController');

router.post('/exam/:examId/publish', protectAdmin, publishResult);
router.get('/exam/:examId/export-excel', protectAdmin, exportExcel);
router.get('/exam/:examId/student/:studentId/excel', protectAdmin, exportStudentExcel);
router.get('/exam/:examId/analytics', protectAdmin, getAnalytics);
router.get('/exam/:examId/student/:studentId/report', protectAdmin, getStudentReport);
// Public route so students can download their own PDFs
router.get('/exam/:examId/student/:studentId/pdf', exportPdf);

module.exports = router;
