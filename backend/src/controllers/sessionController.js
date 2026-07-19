const Session = require('../models/Session');

// @desc    Get all sessions globally
// @route   GET /api/sessions
// @access  Private (Admin)
const getAllSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find()
      .populate('studentId', 'name rollNumber')
      .populate('examId', 'title examCode')
      .sort('-createdAt');
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSessions
};
