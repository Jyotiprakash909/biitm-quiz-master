const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  socketId: {
    type: String,
  },
  deviceFingerprint: {
    type: String,
  },
  browserInfo: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  lastHeartbeat: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Waiting', 'Active', 'Disconnected', 'Submitted', 'AutoSubmitted'],
    default: 'Waiting',
  },
  joinTime: {
    type: Date,
  },
  startTime: {
    type: Date,
  },
  submissionTime: {
    type: Date,
  },
  approvedAt: {
    type: Date,
  },
  violationCount: {
    type: Number,
    default: 0,
  },
  currentQuestionIndex: {
    type: Number,
    default: 0,
  },
  activityTimeline: [{
    event: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Unique compound index
sessionSchema.index({ studentId: 1, examId: 1 }, { unique: true });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
