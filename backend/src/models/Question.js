const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
  },
  questionNumber: {
    type: Number,
  },
  subject: {
    type: String,
    required: true,
    default: 'General'
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  type: {
    type: String,
    enum: ['MCQ', 'True/False', 'Multiple Correct', 'Subjective'],
    default: 'MCQ'
  },
  text: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: [arr => arr.length >= 2, 'Options must have at least 2 items'],
  },
  correctAnswer: {
    type: String,
    required: true,
  },
  marks: {
    type: Number,
    required: true,
    min: 1,
  },
}, { timestamps: true });

// Indexes for frequent queries
questionSchema.index({ examId: 1, questionNumber: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
