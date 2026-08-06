const Result = require('../models/Result');
const Submission = require('../models/Submission');
const Session = require('../models/Session');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const Question = require('../models/Question');
const Settings = require('../models/Settings');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const Notification = require('../models/Notification');

// @desc    Publish/Unpublish results
// @route   POST /api/results/exam/:examId/publish
// @access  Private
const publishResult = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { isPublished } = req.body;

    let result = await Result.findOne({ examId });
    if (!result) {
      result = new Result({ examId });
    }

    result.isPublished = isPublished;
    result.publishedAt = isPublished ? new Date() : null;
    await result.save();

    if (isPublished) {
      await Notification.create({
        title: 'Results Published',
        description: `Results for exam ${examId} have been published to students.`,
        examId,
        severity: 'success',
        type: 'Exam',
        link: `/admin/results/${examId}`
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Export Complete Result Sheet
// @route   GET /api/results/exam/:examId/export-excel
// @access  Private
const exportExcel = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) {
      res.status(404);
      throw new Error('Exam not found');
    }

    const submissions = await Submission.find({ examId }).populate('studentId', 'rollNumber name');
    const sessions = await Session.find({ examId });
    const questions = await Question.find({ examId });

    const sessionMap = new Map();
    sessions.forEach(s => sessionMap.set(s.studentId.toString(), s));

    // Sort by rank
    submissions.sort((a, b) => b.marksObtained - a.marksObtained);

    const data = submissions.map((sub, index) => {
      const session = sessionMap.get(sub.studentId._id.toString());
      
      let correct = 0;
      let wrong = 0;
      let unanswered = 0;

      questions.forEach(q => {
        const ans = sub.answers.get(q._id.toString());
        if (!ans) unanswered++;
        else if (ans === q.correctAnswer) correct++;
        else wrong++;
      });

      return {
        'Exam Name': exam.title,
        'Exam Status': exam.status,
        'Rank': index + 1,
        'Roll Number': sub.studentId.rollNumber,
        'Student Name': sub.studentId.name,
        'Score': sub.marksObtained,
        'Percentage': sub.totalMarks > 0 ? ((sub.marksObtained / sub.totalMarks) * 100).toFixed(2) + '%' : '0%',
        'Correct': correct,
        'Wrong': wrong,
        'Unanswered': unanswered,
        'Violations': session ? session.violationCount : 0,
        'Submission Type': sub.status,
        'Submission Time': session && session.submissionTime ? new Date(session.submissionTime).toLocaleString() : 'N/A'
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Results');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Results_${exam.examCode}.xlsx`);
    res.send(buffer);

  } catch (error) {
    next(error);
  }
};

// @desc    Export Individual Student Excel
// @route   GET /api/results/exam/:examId/student/:studentId/excel
// @access  Private
const exportStudentExcel = async (req, res, next) => {
  try {
    const { examId, studentId } = req.params;

    const exam = await Exam.findById(examId);
    const student = await Student.findById(studentId);
    const submission = await Submission.findOne({ examId, studentId });
    const session = await Session.findOne({ examId, studentId });
    const questions = await Question.find({ examId }).sort('questionNumber');

    if (!exam || !student || !submission) {
      res.status(404);
      throw new Error('Data not found');
    }

    const data = questions.map((q) => {
      const studentAnswer = submission.answers.get(q._id.toString());
      let status = 'Unanswered';
      if (studentAnswer) {
        status = studentAnswer === q.correctAnswer ? 'Correct' : 'Wrong';
      }

      return {
        'Question Number': q.questionNumber,
        'Question Text': q.text,
        'Student Answer': studentAnswer || 'N/A',
        'Correct Answer': q.correctAnswer,
        'Status': status,
        'Marks Awarded': status === 'Correct' ? q.marks : 0,
        'Total Marks': q.marks
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Student Report');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Report_${student.rollNumber}_${exam.examCode}.xlsx`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// @desc    Export Individual Student PDF
// @route   GET /api/results/exam/:examId/student/:studentId/pdf
// @access  Private
const exportPdf = async (req, res, next) => {
  try {
    const { examId, studentId } = req.params;

    const exam = await Exam.findById(examId);
    const student = await Student.findById(studentId);
    const submission = await Submission.findOne({ examId, studentId });
    const session = await Session.findOne({ examId, studentId });
    const questions = await Question.find({ examId }).sort('questionNumber');
    const settings = await Settings.findOne() || {};

    if (!exam || !student || !submission) {
      res.status(404);
      throw new Error('Data not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Marksheet_${student.rollNumber}.pdf`);

    // Using autoFirstPage: false to handle our own header/footer properly on multiple pages if needed
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
    doc.pipe(res);

    let logoBuffer = null;
    if (settings.institutionLogo && settings.institutionLogo.startsWith('data:image/')) {
      try {
        const base64Data = settings.institutionLogo.split(',')[1];
        logoBuffer = Buffer.from(base64Data, 'base64');
      } catch (e) {
        console.error('Logo parse error', e);
      }
    }

    const primaryColor = settings.primaryColor || '#0f172a';
    
    // Draw Header
    doc.rect(0, 0, 595, 120).fill(primaryColor);
    
    if (logoBuffer) {
      try {
        // Position logo on the left
        doc.image(logoBuffer, 50, 30, { fit: [60, 60], align: 'center', valign: 'center' });
      } catch(e) {}
    }

    doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text(settings.institutionName || 'BIITM QUIZ MASTER', 0, 35, { align: 'center', characterSpacing: 1 });
    doc.fontSize(12).font('Helvetica').text(settings.pdfHeader || 'Secure Online Examination Platform', 0, 65, { align: 'center' });
    
    doc.moveDown(4);
    doc.fillColor('#0f172a');

    // Title
    doc.fontSize(18).font('Helvetica-Bold').text('OFFICIAL EXAM MARKSHEET', { align: 'center' });
    doc.moveDown(0.5);
    doc.rect(200, doc.y, 195, 2).fill('#3b82f6');
    doc.moveDown(1.5);
    
    // Info Box
    const boxY = doc.y;
    doc.roundedRect(50, boxY, 495, 120, 8).lineWidth(1).stroke('#e2e8f0');
    
    doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold').text('EXAM DETAILS', 70, boxY + 15);
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica').text(exam.title, 70, boxY + 30);
    doc.fontSize(10).text(`Code: ${exam.examCode}`, 70, boxY + 45);
    doc.text(`Date: ${new Date(session?.submissionTime || Date.now()).toLocaleDateString()}`, 70, boxY + 60);
    
    let timeTakenStr = 'N/A';
    if (session && session.startTime && session.submissionTime) {
      const diffMs = new Date(session.submissionTime) - new Date(session.startTime);
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      timeTakenStr = `${diffMins}m ${diffSecs}s`;
    }
    doc.text(`Time Taken: ${timeTakenStr}`, 70, boxY + 75);
    
    doc.moveTo(297, boxY + 15).lineTo(297, boxY + 105).lineWidth(1).stroke('#e2e8f0');

    doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold').text('CANDIDATE DETAILS', 315, boxY + 15);
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(student.name, 315, boxY + 30);
    doc.font('Helvetica').fontSize(10).text(`Roll No: ${student.rollNumber}`, 315, boxY + 45);
    doc.text(`Violations: ${session?.violationCount || 0}`, 315, boxY + 60);
    doc.text(`Status: ${submission.status}`, 315, boxY + 75);

    doc.y = boxY + 135;

    // Score Summary
    const percentage = submission.totalMarks > 0 ? ((submission.marksObtained / submission.totalMarks) * 100).toFixed(2) : 0;
    const isPass = percentage >= (settings.defaultPassPercentage || 40);

    doc.roundedRect(50, doc.y, 495, 75, 8).fill('#f8fafc').stroke('#e2e8f0');
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('FINAL SCORE', 50, doc.y + 15, { align: 'center' });
    doc.fontSize(22).fillColor('#3b82f6').text(`${submission.marksObtained} / ${submission.totalMarks}`, { align: 'center' });
    doc.fontSize(12).fillColor(isPass ? '#10b981' : '#ef4444').text(`${percentage}% - ${isPass ? 'PASS' : 'FAIL'}`, { align: 'center' });
    
    doc.moveDown(2);

    // Detailed Report
    doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('Detailed Question Analysis');
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1).stroke('#cbd5e1');
    doc.moveDown(1);

    const checkPageBreak = (neededHeight) => {
      if (doc.y + neededHeight > 750) {
        doc.addPage();
        doc.moveTo(50, 50).lineTo(545, 50).lineWidth(1).stroke('#cbd5e1');
        doc.moveDown(1);
      }
    };

    questions.forEach((q, index) => {
      // Estimate height: Question text (2 lines approx) + options (4 lines) + result (1-2 lines) + spacing
      checkPageBreak(120);
      
      const stdAns = submission.answers.get(q._id.toString());
      const isCorrect = stdAns === q.correctAnswer;
      const isUnanswered = !stdAns;
      
      doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text(`Q${index + 1}. ${q.text}`, { width: 495 });
      doc.moveDown(0.5);
      
      const optionLabels = ['A', 'B', 'C', 'D'];
      doc.font('Helvetica').fontSize(10);
      
      q.options.forEach((opt, idx) => {
        const label = optionLabels[idx] || (idx + 1).toString();
        let color = '#475569';
        let prefix = `  ${label}) `;
        
        if (opt === stdAns) {
          if (isCorrect) {
            color = '#15803d'; // Green for correct selected
            prefix = `✔ ${label}) `;
          } else {
            color = '#b91c1c'; // Red for wrong selected
            prefix = `❌ ${label}) `;
          }
        } else if (!isCorrect && opt === q.correctAnswer) {
           color = '#15803d'; // Green for correct answer if they got it wrong or unanswered
           prefix = `✔ ${label}) `;
        }

        doc.fillColor(color).text(`${prefix}${opt}`, { indent: 15 });
      });
      
      doc.moveDown(0.5);
      
      doc.font('Helvetica-Bold').fontSize(10);
      if (isUnanswered) {
        doc.fillColor('#64748b').text('Not Answered', { indent: 15 });
      } else if (isCorrect) {
        doc.fillColor('#15803d').text('✔ Selected (Correct)', { indent: 15 });
      } else {
        doc.fillColor('#b91c1c').text('❌ Selected', { indent: 15 });
      }
      
      doc.font('Helvetica').fontSize(9).fillColor('#94a3b8').text(`Marks: ${isCorrect ? q.marks : 0} / ${q.marks}`, { align: 'right' });
      
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke('#e2e8f0');
      doc.moveDown(0.5);
    });

    // Add footer to all pages
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(9).fillColor('#94a3b8').text(
        settings.pdfFooter || 'Generated by BIITM Quiz Master',
        50,
        800,
        { align: 'center', width: 495 }
      );
    }

    doc.end();

  } catch (error) {
    next(error);
  }
};

// @desc    Get Specific Student Report Data
// @route   GET /api/results/exam/:examId/student/:studentId/report
// @access  Private
const getStudentReport = async (req, res, next) => {
  try {
    const { examId, studentId } = req.params;
    
    const submission = await Submission.findOne({ examId, studentId }).populate('studentId');
    const session = await Session.findOne({ examId, studentId });
    const questions = await Question.find({ examId });
    
    if (!submission) {
      res.status(404);
      throw new Error('Report not found');
    }

    const report = questions.map(q => {
      const studentAnswer = submission.answers.get(q._id.toString());
      return {
        questionText: q.text,
        studentAnswer: studentAnswer || 'Not Answered',
        correctAnswer: q.correctAnswer,
        isCorrect: studentAnswer === q.correctAnswer,
        marks: q.marks
      };
    });

    res.json({
      student: submission.studentId,
      session,
      submission: {
        marksObtained: submission.marksObtained,
        totalMarks: submission.totalMarks,
        status: submission.status
      },
      report
    });
  } catch(error) {
    next(error);
  }
};

// @desc    Get Exam Analytics
// @route   GET /api/results/exam/:examId/analytics
// @access  Private
const getAnalytics = async (req, res, next) => {
  try {
    const { examId } = req.params;
    
    const submissions = await Submission.find({ examId, status: { $in: ['Submitted', 'AutoSubmitted'] } }).populate('studentId', 'name rollNumber');
    const result = await Result.findOne({ examId });

    let totalMarksObtained = 0;
    let highestScore = 0;
    let lowestScore = submissions.length > 0 ? Infinity : 0;
    let passed = 0;
    let failed = 0;

    const topPerformers = submissions.map(sub => {
      const isPass = sub.totalMarks > 0 && (sub.marksObtained / sub.totalMarks) >= 0.4;
      
      totalMarksObtained += sub.marksObtained;
      if (sub.marksObtained > highestScore) highestScore = sub.marksObtained;
      if (sub.marksObtained < lowestScore) lowestScore = sub.marksObtained;
      if (isPass) passed++; else failed++;

      return {
        studentId: sub.studentId._id,
        name: sub.studentId.name,
        rollNumber: sub.studentId.rollNumber,
        marksObtained: sub.marksObtained,
        totalMarks: sub.totalMarks
      };
    }).sort((a, b) => b.marksObtained - a.marksObtained);

    const averageScore = submissions.length > 0 ? totalMarksObtained / submissions.length : 0;

    res.json({
      isPublished: result ? result.isPublished : false,
      totalSubmissions: submissions.length,
      averageScore,
      highestScore,
      lowestScore: lowestScore === Infinity ? 0 : lowestScore,
      passed,
      failed,
      topPerformers: topPerformers.slice(0, 10) // Return top 10
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  publishResult,
  exportExcel,
  exportStudentExcel,
  exportPdf,
  getAnalytics,
  getStudentReport
};
