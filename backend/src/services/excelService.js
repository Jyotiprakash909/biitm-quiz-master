const xlsx = require('xlsx');

const parseQuestionsExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const data = xlsx.utils.sheet_to_json(sheet);
  
  const questions = data.map((row, index) => {
    // Expecting columns: Question | Option A | Option B | Option C | Option D | Correct Answer | Marks
    const text = row['Question'];
    const options = [
      row['Option A'],
      row['Option B'],
      row['Option C'],
      row['Option D']
    ].filter(Boolean); // Filter out empty options

    const correctAnswer = row['Correct Answer'];
    const marks = row['Marks'] ? Number(row['Marks']) : 1;

    if (!text || options.length < 2 || !correctAnswer) {
      throw new Error(`Invalid data in row ${index + 2}`); // +2 because 0-index + header row
    }

    return {
      text,
      options,
      correctAnswer,
      marks
    };
  });

  return questions;
};

module.exports = {
  parseQuestionsExcel
};
