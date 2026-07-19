const Session = require('../models/Session');
const Submission = require('../models/Submission');
const Violation = require('../models/Violation');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const examEvents = require('../utils/examEvents');

module.exports = (io) => {
  // Helper: Force submit
  async function forceSubmit(examId, studentId) {
    try {
      const submission = await Submission.findOne({ examId, studentId });
      const session = await Session.findOne({ examId, studentId });
      
      if (submission && submission.status === 'Draft') {
        const questions = await Question.find({ examId });
        let marksObtained = 0;
        let totalMarks = 0;

        questions.forEach(q => {
          totalMarks += q.marks;
          if (submission.answers.get(q._id.toString()) === q.correctAnswer) {
            marksObtained += q.marks;
          }
        });

        submission.marksObtained = marksObtained;
        submission.totalMarks = totalMarks;
        submission.status = 'AutoSubmitted';
        await submission.save();
      }

      if (session) {
        session.status = 'AutoSubmitted';
        session.submissionTime = new Date();
        session.activityTimeline.push({ event: 'Force Submitted by Anti-Cheat' });
        await session.save();
        
        io.to(session.socketId).emit('force_submit');
        io.to(`admin_${examId}`).emit('student_status_update', { studentId, status: 'AutoSubmitted', violationCount: session.violationCount });

        const student = await Student.findById(studentId);
        const exam = await Exam.findById(examId);
        if (student && exam) {
          await Notification.create({
            title: 'Student Auto-Submitted',
            description: `${student.name} (${student.rollNumber}) exceeded the violation threshold and was auto-submitted.`,
            examId,
            studentId,
            severity: 'error',
            type: 'Security',
            link: `/admin/sessions`
          });
        }
      }
    } catch (err) {
      console.error('Force submit error', err);
    }
  }

  // Listen to backend timer events to auto-submit all active students
  examEvents.on('end_exam', async (examId) => {
    try {
      const activeSessions = await Session.find({ examId, status: 'Active' });
      for (const session of activeSessions) {
        await forceSubmit(examId, session.studentId);
      }
      io.to(examId).emit('exam_ended');
    } catch (err) {
      console.error('Error during end_exam global submit', err);
    }
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Student joins an exam room
    socket.on('student_join', async ({ examId, studentId, deviceFingerprint, browserInfo }) => {
      socket.join(examId);
      
      try {
        const session = await Session.findOne({ examId, studentId });
        if (session) {
          // Check for session conflict (if they log in from elsewhere)
          if (session.socketId && session.socketId !== socket.id && session.status === 'Active') {
            const oldSocket = io.sockets.sockets.get(session.socketId);
            if (oldSocket) {
              // Notify old socket
              io.to(session.socketId).emit('session_conflict');
              
              // Log violation
              await Violation.create({ studentId, examId, type: 'SessionConflict' });
              
              const updatedSession = await Session.findOneAndUpdate(
                { _id: session._id },
                { 
                  $inc: { violationCount: 1 },
                  $push: { activityTimeline: { event: 'Violation: SessionConflict', timestamp: new Date() } }
                },
                { new: true }
              );
              
              // Check if violation limit reached
              const exam = await Exam.findById(examId);
              if (updatedSession.violationCount >= exam.warningThreshold) {
                await forceSubmit(examId, studentId);
              }
            }
          }
          
          session.socketId = socket.id;
          session.deviceFingerprint = deviceFingerprint;
          session.browserInfo = browserInfo;
          session.ipAddress = socket.handshake.address;
          session.lastHeartbeat = new Date();
          session.activityTimeline.push({ event: 'Reconnected' });
          await session.save();

          // Notify admin room
          io.to(`admin_${examId}`).emit('student_status_update', { studentId, status: session.status, violationCount: session.violationCount });
        }
      } catch (err) {
        console.error(err);
      }
    });

    // Admin joins to monitor an exam
    socket.on('admin_join', ({ examId }) => {
      socket.join(`admin_${examId}`);
    });

    // Save draft answer
    socket.on('save_draft', async ({ examId, studentId, questionId, selectedOption }) => {
      try {
        const submission = await Submission.findOne({ examId, studentId });
        if (submission && submission.status === 'Draft') {
          submission.answers.set(questionId, selectedOption);
          await submission.save();
        }
      } catch (err) {
        console.error('Draft save error', err);
      }
    });

    // Save progress index
    socket.on('save_progress', async ({ examId, studentId, currentIndex }) => {
      try {
        const session = await Session.findOne({ examId, studentId });
        if (session && session.status === 'Active') {
          session.currentQuestionIndex = currentIndex;
          await session.save();
        }
      } catch (err) {
        console.error('Progress save error', err);
      }
    });

    // Report violation
    socket.on('report_violation', async ({ examId, studentId, violationType }) => {
      try {
        const session = await Session.findOne({ examId, studentId });
        const exam = await Exam.findById(examId);

        if (session && exam && session.status === 'Active') {
          // Additional anti-cheat validation
          if ((violationType === 'TabSwitch' || violationType === 'AppSwitch') && !exam.strictTabSwitch) {
            return;
          }
          if (violationType === 'FullscreenExit' && !exam.strictFullscreen) {
            return;
          }
          if (violationType === 'CopyAttempt' && !exam.copyPasteProtection) {
            return;
          }

          await Violation.create({ studentId, examId, type: violationType });
          
          const updatedSession = await Session.findOneAndUpdate(
            { _id: session._id },
            { 
              $inc: { violationCount: 1 },
              $push: { activityTimeline: { event: `Violation: ${violationType}`, timestamp: new Date() } }
            },
            { new: true }
          );

          io.to(`admin_${examId}`).emit('student_status_update', { studentId, status: updatedSession.status, violationCount: updatedSession.violationCount });

          const student = await Student.findById(studentId);
          await Notification.create({
            title: 'Student Violation Detected',
            description: `${student.name} committed a ${violationType} violation. Total: ${updatedSession.violationCount}`,
            examId,
            studentId,
            severity: 'warning',
            type: 'Security',
            link: `/admin/sessions`
          });

          if (updatedSession.violationCount >= exam.warningThreshold) {
            await forceSubmit(examId, studentId);
          }
        }
      } catch (err) {
        console.error('Violation report error', err);
      }
    });

    // Heartbeat
    socket.on('heartbeat', async ({ examId, studentId }) => {
      try {
        const oldSession = await Session.findOneAndUpdate(
          { examId, studentId },
          { $set: { lastHeartbeat: new Date(), status: 'Active' } }
        );
        if (oldSession && oldSession.status === 'Disconnected') {
          io.to(`admin_${examId}`).emit('student_status_update', { studentId, status: 'Active', violationCount: oldSession.violationCount });
        }
      } catch (err) {
        console.error('Heartbeat error', err);
      }
    });

    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id}`);
      try {
        const session = await Session.findOne({ socketId: socket.id });
        if (session && session.status === 'Active') {
          session.status = 'Disconnected';
          await session.save();
          io.to(`admin_${session.examId}`).emit('student_status_update', { studentId: session.studentId, status: 'Disconnected', violationCount: session.violationCount });
        }
      } catch (err) {
        console.error('Disconnect error', err);
      }
    });

    // Helper removed from here, moved to outer scope
  });
};
