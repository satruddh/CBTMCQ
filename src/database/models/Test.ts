import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ITestSchedule {
  startTime: Date;
  endTime: Date;
}

export interface ITest extends Document {
  testName: string;
  description: string;
  academicYear: number;
  subjects: Array<Types.ObjectId>;
  testType: "MIDTERM" | "ENDTERM" | "QUIZ" | "ASSIGNMENT" | "MOCK";
  totalMarks: number;
  duration: number; // in minutes
  passingScore: number;
  schedule: ITestSchedule;
  isActive: boolean;
  isPublished: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const testSchema: Schema<ITest> = new Schema<ITest>(
  {
    testName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    academicYear: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5]
    },
    subjects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Subject"
      }
    ],
    testType: {
      type: String,
      required: true,
      enum: ["MIDTERM", "ENDTERM", "QUIZ", "ASSIGNMENT", "MOCK"]
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    },
    passingScore: {
      type: Number,
      default: 40
    },
    schedule: {
      startTime: { type: Date, required: true },
      endTime: { type: Date, required: true }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

export const TestModel: Model<ITest> = mongoose.model<ITest>("Test", testSchema);
export default TestModel;
