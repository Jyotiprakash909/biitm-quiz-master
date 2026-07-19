const Admin = require('../models/Admin');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const Session = require('../models/Session');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
const authAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });

    if (admin && (await bcrypt.compare(password, admin.passwordHash))) {
      res.json({
        _id: admin._id,
        username: admin.username,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid username or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new admin (For initial setup)
// @route   POST /api/admin/register
// @access  Public or Protected
const registerAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const adminExists = await Admin.findOne({ username });

    if (adminExists) {
      res.status(400);
      throw new Error('Admin already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      username,
      passwordHash,
    });

    if (admin) {
      res.status(201).json({
        _id: admin._id,
        username: admin.username,
        token: generateToken(admin._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid admin data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const totalExams = await Exam.countDocuments();
    const activeExams = await Exam.countDocuments({ status: 'Active' });
    const completedExams = await Exam.countDocuments({ status: 'Completed' });
    const totalStudents = await Student.countDocuments();
    
    const results = await require('../models/Result').find({ isPublished: true }).populate('examId');
    const publishedResultsCount = results.length;

    const allSessions = await Session.find().populate('examId');
    const allSubmissions = await require('../models/Submission').find();
    
    let totalViolations = 0;
    let autoSubmittedCount = 0;
    
    // Pass vs Fail stats across all submissions where totalMarks > 0
    let totalPass = 0;
    let totalFail = 0;
    let totalMarksObtained = 0;
    let totalPossibleMarks = 0;

    allSubmissions.forEach(sub => {
      if (sub.status === 'Submitted' || sub.status === 'AutoSubmitted') {
        const percentage = sub.totalMarks > 0 ? (sub.marksObtained / sub.totalMarks) * 100 : 0;
        if (percentage >= 40) totalPass++; else totalFail++;
        totalMarksObtained += sub.marksObtained;
        totalPossibleMarks += sub.totalMarks;
      }
    });

    const overallPassRate = (totalPass + totalFail) > 0 ? ((totalPass / (totalPass + totalFail)) * 100).toFixed(1) : 0;
    const overallAverageScore = totalPossibleMarks > 0 ? ((totalMarksObtained / totalPossibleMarks) * 100).toFixed(1) : 0;

    // Violation Analytics Trend
    const violationTrend = {};
    
    allSessions.forEach(s => {
      totalViolations += (s.violationCount || 0);
      if (s.status === 'AutoSubmitted') autoSubmittedCount++;
      
      // Basic trend by Exam
      if (s.examId && s.examId.title) {
        if (!violationTrend[s.examId.title]) {
          violationTrend[s.examId.title] = 0;
        }
        violationTrend[s.examId.title] += (s.violationCount || 0);
      }
    });

    // Format violation trend for charts
    const violationTrendData = Object.keys(violationTrend).map(key => ({
      name: key,
      violations: violationTrend[key]
    })).slice(0, 5); // top 5
    
    // For active exams, get live session stats
    const activeSessions = await Session.aggregate([
      {
        $lookup: {
          from: 'exams',
          localField: 'examId',
          foreignField: '_id',
          as: 'exam'
        }
      },
      { $unwind: '$exam' },
      { $match: { 'exam.status': 'Active' } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const sessionStats = {
      Waiting: 0,
      Active: 0,
      Submitted: 0,
      AutoSubmitted: 0,
      Disconnected: 0
    };

    activeSessions.forEach(stat => {
      if (sessionStats[stat._id] !== undefined) {
        sessionStats[stat._id] = stat.count;
      }
    });

    // Chart Data payload
    const chartData = {
      passVsFail: [
        { name: 'Pass', value: totalPass },
        { name: 'Fail', value: totalFail }
      ],
      violationTrend: violationTrendData,
      liveStatus: [
        { name: 'Waiting', value: sessionStats.Waiting },
        { name: 'Active', value: sessionStats.Active },
        { name: 'Submitted', value: sessionStats.Submitted + sessionStats.AutoSubmitted },
        { name: 'Disconnected', value: sessionStats.Disconnected }
      ]
    };

    const recentExams = await Exam.find().sort({ createdAt: -1 }).limit(5).select('examCode title status createdAt');
    const recentSubmissions = await require('../models/Submission').find({ status: { $in: ['Submitted', 'AutoSubmitted'] } })
      .sort({ updatedAt: -1 }).limit(5).populate('examId', 'title').populate('studentId', 'name rollNumber');
    const recentViolations = await Session.find({ violationCount: { $gt: 0 } })
      .sort({ updatedAt: -1 }).limit(5).populate('examId', 'title').populate('studentId', 'name rollNumber');

    res.json({
      totalExams,
      activeExams,
      completedExams,
      totalStudents,
      totalViolations,
      autoSubmittedCount,
      publishedResultsCount,
      overallPassRate,
      overallAverageScore,
      liveStats: sessionStats,
      chartData,
      recentExams,
      recentSubmissions,
      recentViolations
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authAdmin,
  registerAdmin,
  getDashboardStats,
};
