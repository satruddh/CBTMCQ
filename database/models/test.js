const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  testName: {
    type: String,
    required: true,
  },
  description:String,
  academicYear: {
    type: Number,
    required: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  testType: {
    type: String,
    required: true,
    enum: ['MIDTERM', 'ENDTERM', 'QUIZ', 'ASSIGNMENT', 'MOCK']
  },
  totalMarks: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  passingScore: {
    type: Number,
    default: 40
  },
  schedule: {
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);