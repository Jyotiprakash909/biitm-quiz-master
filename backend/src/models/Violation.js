const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['TabSwitch', 'Minimize', 'FullscreenExit', 'Refresh', 'AppSwitch', 'SessionConflict', 'CopyAttempt', 'PasteAttempt', 'TextSelection', 'HeartbeatLost'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for querying violations for a student in an exam
violationSchema.index({ studentId: 1, examId: 1 });

const Violation = mongoose.model('Violation', violationSchema);

module.exports = Violation;
