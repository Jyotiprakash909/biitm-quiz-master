const xlsx = require('xlsx');

const parseQuestionsExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Get raw data
  const data = xlsx.utils.sheet_to_json(sheet, { defval: '' }); // use defval to get empty cells as ''
  
  const questions = [];
  const errors = [];
  const questionSet = new Set(); // To check duplicates within the file

  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 because index is 0-based and row 1 is header

    // Map columns strictly (trimming keys and values)
    const getVal = (key) => {
      const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
      return foundKey && row[foundKey] !== null && row[foundKey] !== undefined ? String(row[foundKey]).trim() : '';
    };

    const text = getVal('Question');
    const optA = getVal('Option A');
    const optB = getVal('Option B');
    const optC = getVal('Option C');
    const optD = getVal('Option D');
    const correctAnswer = getVal('Correct Answer');
    const marksStr = getVal('Marks');

    // Validation
    if (!text) {
      errors.push(`Row ${rowNum}: Question text is empty.`);
      return; // Skip further validation for this row if no question text
    }

    if (questionSet.has(text.toLowerCase())) {
      errors.push(`Row ${rowNum}: Duplicate question "${text.substring(0, 30)}...".`);
    }
    questionSet.add(text.toLowerCase());

    const options = [optA, optB, optC, optD].filter(Boolean);

    if (!optA) errors.push(`Row ${rowNum}: Option A is empty.`);
    if (!optB) errors.push(`Row ${rowNum}: Option B is empty.`);
    
    // We expect at least two options, ideally all 4 if they are provided, but let's strictly require 2, or maybe if C is provided but not D? 
    // The requirement says "Option C is empty" if it's missing, let's enforce all 4 if they are part of the template.
    // Actually, usually 4 options are required. Let's enforce 2 min, but check if they match correct answer.
    if (options.length < 2) {
      errors.push(`Row ${rowNum}: Needs at least 2 options.`);
    }

    if (!correctAnswer) {
      errors.push(`Row ${rowNum}: Correct Answer is empty.`);
    } else if (!options.includes(correctAnswer)) {
      errors.push(`Row ${rowNum}: Correct Answer "${correctAnswer}" does not match any of the provided options.`);
    }

    let marks = 1;
    if (marksStr) {
      marks = Number(marksStr);
      if (isNaN(marks) || marks <= 0) {
        errors.push(`Row ${rowNum}: Marks must be a positive number.`);
      }
    } else {
      errors.push(`Row ${rowNum}: Marks column is empty.`);
    }

    questions.push({
      text,
      options,
      correctAnswer,
      marks
    });
  });

  if (errors.length > 0) {
    const errorMsg = errors.join('\n');
    throw new Error(errorMsg);
  }

  if (questions.length === 0) {
    throw new Error("The uploaded Excel file contains no valid questions.");
  }

  return questions;
};

module.exports = {
  parseQuestionsExcel
};
