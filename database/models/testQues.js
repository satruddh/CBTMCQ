const mongoose = require('mongoose');

const testQuestionSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  assignedMarks: {
    type: Number,
    required: true
  },
  sequenceNumber: {
    type: Number,
    required: true
  },
  section: {
    type: String,
    trim: true
  }
}, { timestamps: true });

testQuestionSchema.index({ testId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('TestQuestion', testQuestionSchema);