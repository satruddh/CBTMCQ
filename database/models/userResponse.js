const mongoose = require('mongoose');

const userResponseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testQuestionId: {  // Reference to TestQuestion mapping
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestQuestion',
    required: true
  },
  selectedOptionIds: [{ type: mongoose.Schema.Types.ObjectId }],
  status: {
    type: String,
    enum: ['ATTEMPTED', 'UNATTEMPTED', 'MARKED_REVIEW'],
    default: 'UNATTEMPTED'
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  // Evaluation fields (populated after submission)
  isCorrect: Boolean,
  marksObtained: Number
}, { timestamps: true });

// Compound index
userResponseSchema.index(
  { userId: 1, testQuestionId: 1 },
  { unique: true }
);

module.exports = mongoose.model('UserResponse', userResponseSchema);