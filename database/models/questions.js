const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true, default: false },
  explanation: String
}, { _id: true });

const questionSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  questionText: { type: String, required: true },
  questionType: { type: String, enum: ['MCQ', 'True/False', 'MSQ'], default: 'MCQ' },
  options: [optionSchema],
  difficulty: {
    level: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    weight: { type: Number, default: 1.0 }
  },
  usageHistory: [{
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
    testType: String,
    academicYear: Number,
    usedAt: { type: Date, default: Date.now }
  }],
  lastUsed: Date,
  usageCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);