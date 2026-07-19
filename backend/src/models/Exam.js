const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  examCode: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    maxLength: 100,
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 1,
  },
  passPercentage: {
    type: Number,
    default: 40,
  },
  examThemeColor: {
    type: String,
    default: '',
  },
  warningThreshold: {
    type: Number,
    default: 3,
  },
  displayMode: {
    type: String,
    enum: ['single', 'scroll'],
    default: 'single'
  },
  strictFullscreen: {
    type: Boolean,
    default: true,
  },
  strictTabSwitch: {
    type: Boolean,
    default: true,
  },
  copyPasteProtection: {
    type: Boolean,
    default: true,
  },

  retentionPolicy: {
    type: String,
    enum: ['1_DAY', '3_DAYS', '7_DAYS', 'NEVER'],
    default: '1_DAY',
  },
  status: {
    type: String,
    enum: ['Scheduled', 'OpenRegistration', 'Active', 'Paused', 'Completed'],
    default: 'Scheduled',
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
}, { timestamps: true });

// Indexes for frequent queries
examSchema.index({ examCode: 1 });
examSchema.index({ status: 1 });

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
