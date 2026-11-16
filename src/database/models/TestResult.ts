import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ISubjectBreakdown {
  subjectId: Types.ObjectId;
  correct: number;
  incorrect: number;
  unanswered: number;
  marksObtained: number;
}

export interface IDifficultyBreakdown {
  easy: { correct: number; total: number };
  medium: { correct: number; total: number };
  hard: { correct: number; total: number };
}

export interface ITestResult extends Document {
  userId: Types.ObjectId;
  testId: Types.ObjectId;
  startedAt: Date;
  completedAt: Date;
  totalMarksObtained: number;
  percentage: number;
  subjectWiseBreakdown: Array<ISubjectBreakdown>;
  difficultyBreakdown: IDifficultyBreakdown;
  createdAt: Date;
  updatedAt: Date;
}

const subjectBreakdownSchema: Schema<ISubjectBreakdown> = new Schema<ISubjectBreakdown>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    correct: { type: Number, default: 0 },
    incorrect: { type: Number, default: 0 },
    unanswered: { type: Number, default: 0 },
    marksObtained: { type: Number, default: 0 }
  },
  { _id: false }
);

const difficultyCountSchema: Schema = new Schema(
  {
    correct: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  { _id: false }
);

const testResultSchema: Schema<ITestResult> = new Schema<ITestResult>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true
    },
    testId: {
      type: Schema.Types.ObjectId,
      ref: "Test",
      required: true,
      immutable: true
    },
    startedAt: {
      type: Date,
      required: true,
      immutable: true
    },
    completedAt: {
      type: Date,
      required: true
    },
    totalMarksObtained: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    subjectWiseBreakdown: [subjectBreakdownSchema],
    difficultyBreakdown: {
      easy: { type: difficultyCountSchema, default: () => ({ correct: 0, total: 0 }) },
      medium: { type: difficultyCountSchema, default: () => ({ correct: 0, total: 0 }) },
      hard: { type: difficultyCountSchema, default: () => ({ correct: 0, total: 0 }) }
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

// Guarantee single final result record per test attempt (Rule DB-004)
testResultSchema.index({ userId: 1, testId: 1 }, { unique: true });

export const TestResultModel: Model<ITestResult> = mongoose.model<ITestResult>(
  "TestResult",
  testResultSchema
);
export default TestResultModel;
