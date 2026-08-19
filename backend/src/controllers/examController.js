const Exam = require('../models/Exam');
const Question = require('../models/Question');
const crypto = require('crypto');
const examEvents = require('../utils/examEvents');
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');

// Generate unique Exam Code (e.g. BQM-X7K9P2)
const generateExamCode = async () => {
  let isUnique = false;
  let code = '';
  while (!isUnique) {
    const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
    code = `BQM-${randomStr}`;
    const existing = await Exam.findOne({ examCode: code });
    if (!existing) isUnique = true;
  }
  return code;
};

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private (Admin)
const createExam = async (req, res, next) => {
  try {
    const { title, subject, description, durationMinutes, passPercentage, warningThreshold, strictFullscreen, strictTabSwitch, copyPasteProtection, displayMode, examThemeColor, retentionPolicy, status } = req.body;
    
    const examCode = await generateExamCode();

    const exam = await Exam.create({
      examCode,
      title,
      subject,
      description,
      durationMinutes,
      warningThreshold,
      strictFullscreen,
      strictTabSwitch,
      copyPasteProtection,
      displayMode,
      passPercentage,
      examThemeColor,
      retentionPolicy,
      status: status || 'Scheduled'
    });

    res.status(201).json(exam);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private (Admin)
const getExams = async (req, res, next) => {
  try {
    const exams = await Exam.find({}).sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) {
    next(error);
  }
};

// @desc    Get exam by ID
// @route   GET /api/exams/:id
// @access  Private (Admin)
const getExamById = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (exam) {
      res.json(exam);
    } else {
      res.status(404);
      throw new Error('Exam not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Admin)
const updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (exam) {
      exam.title = req.body.title || exam.title;
      exam.subject = req.body.subject || exam.subject;
      exam.description = req.body.description !== undefined ? req.body.description : exam.description;
      exam.durationMinutes = req.body.durationMinutes || exam.durationMinutes;
      exam.warningThreshold = req.body.warningThreshold !== undefined ? req.body.warningThreshold : exam.warningThreshold;
      exam.strictFullscreen = req.body.strictFullscreen !== undefined ? req.body.strictFullscreen : exam.strictFullscreen;
      exam.strictTabSwitch = req.body.strictTabSwitch !== undefined ? req.body.strictTabSwitch : exam.strictTabSwitch;
      exam.copyPasteProtection = req.body.copyPasteProtection !== undefined ? req.body.copyPasteProtection : exam.copyPasteProtection;
      exam.displayMode = req.body.displayMode || exam.displayMode;
      exam.passPercentage = req.body.passPercentage !== undefined ? req.body.passPercentage : exam.passPercentage;
      exam.examThemeColor = req.body.examThemeColor !== undefined ? req.body.examThemeColor : exam.examThemeColor;
      exam.retentionPolicy = req.body.retentionPolicy || exam.retentionPolicy;

      const updatedExam = await exam.save();
      res.json(updatedExam);
    } else {
      res.status(404);
      throw new Error('Exam not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Archive exam
// @route   PUT /api/exams/:id/archive
// @access  Private (Admin)
const archiveExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (exam) {
      exam.isArchived = true;
      await exam.save();
      res.json({ message: 'Exam archived' });
    } else {
      res.status(404);
      throw new Error('Exam not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Admin)
const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (exam) {
      await Exam.findByIdAndDelete(req.params.id);
      await Question.deleteMany({ examId: req.params.id });
      res.json({ message: 'Exam deleted completely' });
    } else {
      res.status(404);
      throw new Error('Exam not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate exam
// @route   POST /api/exams/:id/duplicate
// @access  Private (Admin)
const duplicateExam = async (req, res, next) => {
  try {
    const examToDuplicate = await Exam.findById(req.params.id);
    if (!examToDuplicate) {
      res.status(404);
      throw new Error('Exam not found');
    }

    const examCode = await generateExamCode();
    const newExam = await Exam.create({
      examCode,
      title: `${examToDuplicate.title} (Copy)`,
      subject: examToDuplicate.subject,
      description: examToDuplicate.description,
      durationMinutes: examToDuplicate.durationMinutes,
      warningThreshold: examToDuplicate.warningThreshold,
      strictFullscreen: examToDuplicate.strictFullscreen,
      strictTabSwitch: examToDuplicate.strictTabSwitch,
      copyPasteProtection: examToDuplicate.copyPasteProtection,
      displayMode: examToDuplicate.displayMode,
      passPercentage: examToDuplicate.passPercentage,
      examThemeColor: examToDuplicate.examThemeColor,
      retentionPolicy: examToDuplicate.retentionPolicy,
      status: 'Scheduled'
    });

    const existingQuestions = await Question.find({ examId: req.params.id });
    if(existingQuestions.length > 0) {
      const questionsToInsert = existingQuestions.map(q => ({
        examId: newExam._id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: q.marks,
        questionNumber: q.questionNumber
      }));
      await Question.insertMany(questionsToInsert);
    }
    
    res.status(201).json(newExam);
  } catch (error) {
    next(error);
  }
};

// @desc    Update exam status
// @route   PUT /api/exams/:id/status
// @access  Private (Admin)
const updateExamStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const exam = await Exam.findById(req.params.id);

    if (exam) {
      exam.status = status;
      await exam.save();

      await Notification.create({
        title: `Exam ${status}`,
        description: `Exam ${exam.examCode} status was changed to ${status}.`,
        examId: exam._id,
        severity: 'info',
        type: 'System',
        link: `/admin/exams/${exam._id}`
      });
      
      if (status === 'Active') {
        exam.startTime = new Date();
        const durationMs = exam.durationMinutes * 60 * 1000;
        exam.endTime = new Date(exam.startTime.getTime() + durationMs);
        
        // Find all currently waiting sessions (pre-registered) and start them automatically
        const Session = require('../models/Session');
        const waitingSessions = await Session.find({ examId: exam._id, status: 'Waiting' });
        
        if (waitingSessions.length > 0) {
          const sessionIds = waitingSessions.map(s => s._id);
          await Session.updateMany(
            { _id: { $in: sessionIds } },
            { $set: { status: 'Active', startTime: exam.startTime } }
          );

          // Emit socket event to each student so they transition automatically
          const { getIo } = require('../sockets/socketManager');
          const io = getIo();
          if (io) {
            waitingSessions.forEach(s => {
              io.to(exam._id.toString()).emit('student_status_update', { studentId: s.studentId, status: 'Active' });
            });
          }
        }

        // Start server timer
        setTimeout(async () => {
          const checkExam = await Exam.findById(exam._id);
          if(checkExam && checkExam.status === 'Active') {
            checkExam.status = 'Completed';
            await checkExam.save();
            examEvents.emit('end_exam', checkExam._id.toString());
          }
        }, durationMs);
      } else if (status === 'Completed') {
        // Trigger end exam immediately
        examEvents.emit('end_exam', exam._id.toString());
      }

      const updatedExam = await exam.save();
      res.json(updatedExam);
    } else {
      res.status(404);
      throw new Error('Exam not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get live stats
// @route   GET /api/exams/:id/live-stats
// @access  Private (Admin)
const getLiveStats = async (req, res, next) => {
  try {
    const Session = require('../models/Session');
    const sessions = await Session.find({ examId: req.params.id }).populate('studentId', 'name rollNumber').lean();
    
    let waiting = 0, active = 0, submitted = 0, autoSubmitted = 0, disconnected = 0;
    
    sessions.forEach(s => {
      if (s.status === 'Waiting') waiting++;
      if (s.status === 'Active') active++;
      if (s.status === 'Submitted') submitted++;
      if (s.status === 'AutoSubmitted') autoSubmitted++;
      if (s.status === 'Disconnected') disconnected++;
    });

    const mappedSessions = sessions.map(s => ({
      ...s,
      sessionId: s._id
    }));

    res.json({
      stats: { waiting, active, submitted, autoSubmitted, disconnected },
      sessions: mappedSessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve late student session
// @route   PUT /api/exams/:examId/sessions/:sessionId/approve
// @access  Private (Admin)
const approveSession = async (req, res, next) => {
  try {
    const Session = require('../models/Session');
    const session = await Session.findOne({ _id: req.params.sessionId, examId: req.params.examId });
    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    session.status = 'Active';
    session.startTime = new Date();
    session.approvedAt = new Date();
    session.activityTimeline.push({ event: 'Admin Approved Late Entry' });
    await session.save();

    // Fire socket event so client can proceed
    const { getIo } = require('../sockets/socketManager');
    const io = getIo();
    if (io) {
      io.to(session.examId.toString()).emit('student_status_update', { studentId: session.studentId, status: 'Active' });
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
};

// @desc    Decline late student session
// @route   PUT /api/exams/:examId/sessions/:sessionId/decline
// @access  Private (Admin)
const declineSession = async (req, res, next) => {
  try {
    const Session = require('../models/Session');
    const session = await Session.findOne({ _id: req.params.sessionId, examId: req.params.examId });
    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    session.status = 'Declined';
    session.activityTimeline.push({ event: 'Admin Declined Late Entry' });
    await session.save();

    // Fire socket event so client can show rejection message
    const { getIo } = require('../sockets/socketManager');
    const io = getIo();
    if (io) {
      io.to(session.examId.toString()).emit('student_status_update', { studentId: session.studentId, status: 'Declined' });
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
