const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  severity: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
  type: { type: String, enum: ['System', 'Security', 'Exam'], default: 'System' },
  isRead: { type: Boolean, default: false },
  link: { type: String }, // Optional frontend route to navigate to
  createdAt: { type: Date, default: Date.now, expires: 604800 } // Auto delete after 7 days (604800 seconds)
});

module.exports = mongoose.model('Notification', notificationSchema);
