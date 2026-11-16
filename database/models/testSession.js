const mongoose = require('mongoose');

const shuffledQuestionSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  sequenceNumber: {
    type: Number,
    required: true
  },
  // Shuffled order of option ObjectIds for this candidate
  optionOrder: [{
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }]
}, { _id: false });

const testSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
    immutable: true
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT', 'EVALUATED'],
    default: 'IN_PROGRESS'
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now,
    immutable: true
  },
  expiresAt: {
    type: Date,
    required: true,
    immutable: true
  },
  submittedAt: {
    type: Date,
    default: null
  },
  clientIp: {
    type: String,
    trim: true
  },
  // Bound to the single active user session to prevent proxy test-taking / hijacking
  associatedSessionId: {
    type: String,
    trim: true,
    immutable: true
  },
  lastHeartbeatAt: {
    type: Date,
    default: Date.now
  },
  // Student explicit progress checkpoint
  currentQuestionIndex: {
    type: Number,
    default: 0,
    min: 0
  },
  paletteState: {
    type: Map,
    of: String, // Maps questionId string -> 'ATTEMPTED' | 'UNATTEMPTED' | 'MARKED_REVIEW'
    default: () => new Map()
  },
  lastSavedAt: {
    type: Date,
    default: Date.now
  },
  // Persisted shuffled sequence of questions and their options
  shuffledQuestions: [shuffledQuestionSchema]
}, {
  timestamps: true,
  strict: true
});

// Enforce single active session per student per test
testSessionSchema.index({ userId: 1, testId: 1 }, { unique: true });

// Index for expiry sweep jobs
testSessionSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('TestSession', testSessionSchema);
