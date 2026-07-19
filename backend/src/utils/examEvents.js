const EventEmitter = require('events');
class ExamEmitter extends EventEmitter {}
const examEvents = new ExamEmitter();

module.exports = examEvents;
