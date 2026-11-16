const mongoose = require('mongoose');

const subjectBreakdown = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  correct: Number,
  incorrect: Number,
  unanswered: Number,
  marksObtained: Number
});

const difficultyBreakdown = new mongoose.Schema({
  easy: { correct: Number, total: Number },
  medium: { correct: Number, total: Number },
  hard: { correct: Number, total: Number }
});

const testResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  startedAt: { type: Date, required: true },
  completedAt: { type: Date, required: true },
  totalMarksObtained: { type: Number, required: true },
  percentage: { type: Number, required: true },
  subjectWiseBreakdown: [subjectBreakdown],
  difficultyBreakdown: difficultyBreakdown
}, { timestamps: true });

testResultSchema.index({ userId: 1, testId: 1 }, { unique: true });

module.exports = mongoose.model('TestResult', testResultSchema);