const Student = require('../models/Student');
const Exam = require('../models/Exam');
const Session = require('../models/Session');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const Result = require('../models/Result');
const Notification = require('../models/Notification');

// Fisher-Yates Shuffle
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// @desc    Verify student Roll Number + Exam Code
// @route   POST /api/student/verify
// @access  Public
const verifyStudent = async (req, res, next) => {
  try {
    const { rollNumber, examCode } = req.body;

    const exam = await Exam.findOne({ examCode });
    if (!exam) {
      res.status(404);
      throw new Error('Invalid Exam Code');
    }

    let student = await Student.findOne({ rollNumber });

    if (!student) {
      if (exam.status !== 'OpenRegistration') {
        return res.json({ status: 'RegistrationClosed', examId: exam._id });
      }
      return res.json({ status: 'NeedsRegistration', examId: exam._id });
    }

    let session = await Session.findOne({ studentId: student._id, examId: exam._id });

    if (!session) {
      if (exam.status !== 'OpenRegistration') {
        return res.json({ status: 'RegistrationClosed', examId: exam._id });
      }
      // If student is registered for platform but not for this specific exam session yet
      return res.json({ status: 'NeedsRegistration', examId: exam._id });
    }

    // Exam completion check
    if (exam.status === 'Completed' || exam.status === 'Archived' || session.status === 'Submitted' || session.status === 'AutoSubmitted') {
      return res.json({ status: session.status === 'Waiting' ? 'Completed' : session.status, examId: exam._id, studentId: student._id });
    }

    // Ensure session status matches exam status logic
    if (exam.status === 'Scheduled' || exam.status === 'OpenRegistration') {
      session.status = 'Waiting';
      await session.save();
    }
    // Note: If exam is 'Active' and session is 'Waiting', it remains 'Waiting' until admin approves.

    res.json({ status: session.status, examId: exam._id, studentId: student._id });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a student
// @route   POST /api/student/register
// @access  Public
const registerStudent = async (req, res, next) => {
  try {
    const { rollNumber, examCode, name, phoneNumber } = req.body;

    const exam = await Exam.findOne({ examCode });
    if (!exam) {
      res.status(404);
      throw new Error('Invalid Exam Code');
    }

    if (exam.status !== 'OpenRegistration' && exam.status !== 'Active') {
      res.status(403);
      throw new Error('Registration is currently closed by the instructor.');
    }

    let student = await Student.findOne({ rollNumber });

    if (!student) {
      student = await Student.create({
        rollNumber,
        name,
        phoneNumber,
        lastSeenAt: new Date()
      });
    }

    let session = await Session.findOne({ studentId: student._id, examId: exam._id });

    if (!session) {
      session = await Session.create({
        studentId: student._id,
        examId: exam._id,
        status: 'Waiting', // Even if Active, they must be approved
        joinTime: new Date(),
        startTime: null,
        activityTimeline: [{ event: 'Joined Exam' }]
      });
      
      // Initialize draft submission
      await Submission.create({
        studentId: student._id,
        examId: exam._id,
        answers: {},
        status: 'Draft'
      });

      // Create Notification
      await Notification.create({
        title: 'New Student Registered',
        description: `${student.name} (${student.rollNumber}) has registered for exam ${exam.examCode}.`,
        examId: exam._id,
        studentId: student._id,
        severity: 'info',
        type: 'System',
        link: `/admin/sessions`
      });
    }

    res.json({ status: session.status, examId: exam._id, studentId: student._id });
  } catch (error) {
    next(error);
  }
};

// @desc    Get questions and drafted answers
// @route   GET /api/student/exam-data/:examId
// @access  Public (Should use a token in prod, but using query/body for now)
const getExamData = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { studentId } = req.query; // Send from frontend after verify

    const exam = await Exam.findById(examId);
    const session = await Session.findOne({ examId, studentId });

    if (!exam || !session) {
      res.status(404);
      throw new Error('Exam or session not found');
    }

    if (exam.status === 'Completed' || exam.status === 'Archived') {
      res.status(403);
      throw new Error('Exam is closed');
    }

    if (session.status === 'Submitted' || session.status === 'AutoSubmitted') {
      res.status(400);
      throw new Error('Exam already submitted');
    }

    let questions = await Question.find({ examId }).lean();
    
    // Strip correct answers and randomize options
    const sanitizedQuestions = questions.map(q => {
      delete q.correctAnswer;
      q.options = shuffleArray([...q.options]);
      return q;
    });

    // Randomize questions
    const randomizedQuestions = shuffleArray([...sanitizedQuestions]);

    const submission = await Submission.findOne({ examId, studentId });
    const draftAnswers = submission ? Object.fromEntries(submission.answers) : {};

    res.json({
      exam: {
        title: exam.title,
        examCode: exam.examCode,
        durationMinutes: exam.durationMinutes,
        displayMode: exam.displayMode,
        passPercentage: exam.passPercentage,
        examThemeColor: exam.examThemeColor,
        strictFullscreen: exam.strictFullscreen,
        strictTabSwitch: exam.strictTabSwitch,
        copyPasteProtection: exam.copyPasteProtection,
      },
      questions: randomizedQuestions,
      draftAnswers,
      session: {
        startTime: session.startTime,
        currentQuestionIndex: session.currentQuestionIndex || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit exam
// @route   POST /api/student/submit/:examId
// @access  Public
const submitExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { studentId, answers, autoSubmit } = req.body;

    const exam = await Exam.findById(examId);
    const submission = await Submission.findOne({ examId, studentId });
    const session = await Session.findOne({ examId, studentId });

    if (!submission || !session) {
      res.status(404);
      throw new Error('Session not found');
    }

    if (submission.status !== 'Draft') {
      res.status(400);
      throw new Error('Exam already submitted');
    }

    // Evaluate answers
    const questions = await Question.find({ examId });
    let marksObtained = 0;
    let totalMarks = 0;

    questions.forEach(q => {
      totalMarks += q.marks;
      if (answers && answers[q._id.toString()] === q.correctAnswer) {
        marksObtained += q.marks;
      }
    });

    submission.answers = answers || {};
    submission.marksObtained = marksObtained;
    submission.totalMarks = totalMarks;
    submission.status = autoSubmit ? 'AutoSubmitted' : 'Submitted';
    await submission.save();

    session.status = autoSubmit ? 'AutoSubmitted' : 'Submitted';
    session.submissionTime = new Date();
    session.activityTimeline.push({ event: autoSubmit ? 'Auto Submitted' : 'Manual Submit' });
    await session.save();

    res.json({
      message: 'Exam submitted successfully',
      marksObtained,
      totalMarks,
      status: submission.status
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get result status / detailed result
// @route   GET /api/student/result/:examId
// @access  Public
const getResult = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { studentId } = req.query;

    const submission = await Submission.findOne({ examId, studentId });
    if (!submission) {
      res.status(404);
      throw new Error('Submission not found');
    }

    const session = await Session.findOne({ examId, studentId });
    const result = await Result.findOne({ examId });
    const exam = await Exam.findById(examId);

    if (result && result.isPublished) {
      // Return detailed result
      const questions = await Question.find({ examId }).lean();
      
      const detailedReport = questions.map(q => ({
        questionText: q.text,
        options: q.options,
        studentAnswer: submission.answers.get(q._id.toString()) || null,
        correctAnswer: q.correctAnswer,
        marks: q.marks,
        isCorrect: submission.answers.get(q._id.toString()) === q.correctAnswer
      }));

      res.json({
        isPublished: true,
        marksObtained: submission.marksObtained,
        totalMarks: submission.totalMarks,
        violationCount: session.violationCount,
        report: detailedReport,
        examThemeColor: exam.examThemeColor,
        passPercentage: exam.passPercentage
      });
    } else {
      // Return score only
      res.json({
        isPublished: false,
        marksObtained: submission.marksObtained,
        totalMarks: submission.totalMarks,
        status: submission.status,
        violationCount: session.violationCount
      });
    }

  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyStudent,
  registerStudent,
  getExamData,
  submitExam,
  getResult
};
