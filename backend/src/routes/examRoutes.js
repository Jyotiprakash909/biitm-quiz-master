const express = require('express');
const router = express.Router();
const {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  archiveExam,
  duplicateExam,
  updateExamStatus,
  getLiveStats,
  approveSession,
  declineSession
} = require('../controllers/examController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protectAdmin, createExam)
  .get(protectAdmin, getExams);

router.route('/:id')
  .get(protectAdmin, getExamById)
  .put(protectAdmin, updateExam)
  .delete(protectAdmin, deleteExam);

// Mount question router
const questionRouter = require('./questionRoutes');
router.use('/:examId/questions', questionRouter);

router.put('/:id/archive', protectAdmin, archiveExam);
router.post('/:id/duplicate', protectAdmin, duplicateExam);
router.put('/:id/status', protectAdmin, updateExamStatus);
router.get('/:id/live-stats', protectAdmin, getLiveStats);
router.put('/:examId/sessions/:sessionId/approve', protectAdmin, approveSession);
router.put('/:examId/sessions/:sessionId/decline', protectAdmin, declineSession);

module.exports = router;
