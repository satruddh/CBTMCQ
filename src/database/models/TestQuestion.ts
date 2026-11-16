import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ITestQuestion extends Document {
  testId: Types.ObjectId;
  questionId: Types.ObjectId;
  assignedMarks: number;
  sequenceNumber: number;
  section: string;
  createdAt: Date;
  updatedAt: Date;
}

const testQuestionSchema: Schema<ITestQuestion> = new Schema<ITestQuestion>(
  {
    testId: {
      type: Schema.Types.ObjectId,
      ref: "Test",
      required: true,
      immutable: true
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      immutable: true
    },
    assignedMarks: {
      type: Number,
      required: true,
      min: 0.5
    },
    sequenceNumber: {
      type: Number,
      required: true,
      min: 1
    },
    section: {
      type: String,
      default: "General",
      trim: true
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

// Explicit uniqueness constraints (Rule DB-004)
testQuestionSchema.index({ testId: 1, questionId: 1 }, { unique: true });
testQuestionSchema.index({ testId: 1, sequenceNumber: 1 }, { unique: true });

export const TestQuestionModel: Model<ITestQuestion> = mongoose.model<ITestQuestion>(
  "TestQuestion",
  testQuestionSchema
);
export default TestQuestionModel;
