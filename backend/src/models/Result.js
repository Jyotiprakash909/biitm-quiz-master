const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  publishedAt: {
    type: Date,
  },
}, { timestamps: true });

// Index
resultSchema.index({ examId: 1 });

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
