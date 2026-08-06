const Question = require('../models/Question');
const Exam = require('../models/Exam');
const { parseQuestionsExcel } = require('../services/excelService');
const fs = require('fs');
const xlsx = require('xlsx');

// @desc    Add a manual question
// @route   POST /api/exams/:examId/questions
// @access  Private (Admin)
const addQuestion = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { text, options, correctAnswer, marks } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      res.status(404);
      throw new Error('Exam not found');
    }

    const maxQuestion = await Question.findOne({ examId }).sort('-questionNumber');
    const questionNumber = maxQuestion ? maxQuestion.questionNumber + 1 : 1;

    const question = await Question.create({
      examId,
      questionNumber,
      text,
      options,
      correctAnswer,
      marks
    });

    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all questions for an exam
// @route   GET /api/exams/:examId/questions
// @access  Private (Admin)
const getQuestions = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const questions = await Question.find({ examId }).sort('questionNumber');
    res.json(questions);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all questions globally (Question Bank)
// @route   GET /api/questions
// @access  Private (Admin)
const getGlobalQuestions = async (req, res, next) => {
  try {
    // Populate examId to get exam title if it belongs to an exam
    const questions = await Question.find().populate('examId', 'title examCode').sort('-createdAt');
    res.json(questions);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a question
// @route   PUT /api/exams/:examId/questions/:id
// @access  Private (Admin)
const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);

    if (question) {
      question.text = req.body.text || question.text;
      question.options = req.body.options || question.options;
      question.correctAnswer = req.body.correctAnswer || question.correctAnswer;
      question.marks = req.body.marks || question.marks;

      const updatedQuestion = await question.save();
      res.json(updatedQuestion);
    } else {
      res.status(404);
      throw new Error('Question not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a question
// @route   DELETE /api/exams/:examId/questions/:id
// @access  Private (Admin)
const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);

    if (question) {
      await Question.deleteOne({ _id: id });
      res.json({ message: 'Question removed' });
    } else {
      res.status(404);
      throw new Error('Question not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk add questions (Excel upload)
// @route   POST /api/exams/:examId/questions/bulk
// @access  Private (Admin)
const bulkAddQuestions = async (req, res, next) => {
  try {
    const { examId } = req.params;
    
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload an Excel file');
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      fs.unlinkSync(req.file.path);
      res.status(404);
      throw new Error('Exam not found');
    }

    // Parse Excel
    let parsedQuestions;
    try {
      parsedQuestions = parseQuestionsExcel(req.file.path);
    } catch (err) {
      fs.unlinkSync(req.file.path);
      res.status(400);
      // Ensure the error message string from the parser is forwarded exactly
      throw new Error(err.message);
    }

    const maxQuestion = await Question.findOne({ examId }).sort('-questionNumber');
    let startQuestionNumber = maxQuestion ? maxQuestion.questionNumber + 1 : 1;

    const questionsToInsert = parsedQuestions.map(q => ({
      examId,
      questionNumber: startQuestionNumber++,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      marks: q.marks
    }));

    const inserted = await Question.insertMany(questionsToInsert);
    
    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.status(201).json({ message: `${inserted.length} questions added successfully`, count: inserted.length });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Download Excel Template
// @route   GET /api/exams/:examId/questions/template
// @access  Private (Admin)
const downloadTemplate = (req, res, next) => {
  try {
    const data = [
      {
        'Question': 'What is the capital of France?',
        'Option A': 'Berlin',
        'Option B': 'Paris',
        'Option C': 'Madrid',
        'Option D': 'Rome',
        'Correct Answer': 'Paris',
        'Marks': 1
      },
      {
        'Question': 'What is 2 + 2?',
        'Option A': '3',
        'Option B': '4',
        'Option C': '5',
        'Option D': '6',
        'Correct Answer': '4',
        'Marks': 2
      }
    ];

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Questions');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=QuestionTemplate.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete questions
// @route   POST /api/exams/:examId/questions/bulk-delete
// @access  Private (Admin)
const bulkDeleteQuestions = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { questionIds } = req.body;

    await Question.deleteMany({ _id: { $in: questionIds }, examId });
    res.json({ message: 'Questions deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder questions
// @route   PUT /api/exams/:examId/questions/reorder
// @access  Private (Admin)
const reorderQuestions = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { orderedIds } = req.body; // Array of question IDs in new order

    for (let i = 0; i < orderedIds.length; i++) {
      await Question.findByIdAndUpdate(orderedIds[i], { questionNumber: i + 1 });
    }
    
    res.json({ message: 'Questions reordered successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  bulkAddQuestions,
  bulkDeleteQuestions,
  reorderQuestions,
  getGlobalQuestions,
  downloadTemplate
};
