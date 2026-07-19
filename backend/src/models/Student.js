const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
  },
  lastSeenAt: {
    type: Date,
  }
}, { timestamps: true });

// Index for frequent queries
studentSchema.index({ rollNumber: 1 });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
