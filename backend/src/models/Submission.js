const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
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
  answers: {
    type: Map,
    of: String, // Maps Question ID to Selected Option
    default: {},
  },
  marksObtained: {
    type: Number,
    default: 0,
  },
  totalMarks: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'AutoSubmitted'],
    default: 'Draft',
  },
  isDetailedDeleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Unique compound index
submissionSchema.index({ studentId: 1, examId: 1 }, { unique: true });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
