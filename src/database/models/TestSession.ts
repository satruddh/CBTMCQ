import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IShuffledQuestion {
  testQuestionId: Types.ObjectId;
  questionId: Types.ObjectId;
  sequenceNumber: number;
  optionOrder: Array<Types.ObjectId>;
}

export interface IMigrationRecord {
  fromSessionId: string;
  toSessionId: string;
  fromIp: string;
  toIp: string;
  migratedAt: Date;
}

export interface ITestSession extends Document {
  userId: Types.ObjectId;
  testId: Types.ObjectId;
  status: "SCHEDULED" | "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT" | "EVALUATED";
  enrolledAt: Date;
  startedAt: Date | null;
  expiresAt: Date | null;
  submittedAt: Date | null;
  clientIp: string;
  associatedSessionId: string;
  migrationCount: number;
  lastMigrationAt: Date | null;
  migrationHistory: Array<IMigrationRecord>;
  lastHeartbeatAt: Date;
  currentQuestionIndex: number;
  paletteState: Map<string, string>;
  lastSavedAt: Date;
  shuffledQuestions: Array<IShuffledQuestion>;
  createdAt: Date;
  updatedAt: Date;
}

const shuffledQuestionSchema: Schema<IShuffledQuestion> = new Schema<IShuffledQuestion>(
  {
    testQuestionId: {
      type: Schema.Types.ObjectId,
      ref: "TestQuestion",
      required: true
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true
    },
    sequenceNumber: {
      type: Number,
      required: true
    },
    optionOrder: [
      {
        type: Schema.Types.ObjectId,
        required: true
      }
    ]
  },
  { _id: false }
);

const migrationRecordSchema: Schema<IMigrationRecord> = new Schema<IMigrationRecord>(
  {
    fromSessionId: { type: String, required: true },
    toSessionId: { type: String, required: true },
    fromIp: { type: String, default: "" },
    toIp: { type: String, default: "" },
    migratedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const testSessionSchema: Schema<ITestSession> = new Schema<ITestSession>(
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
    status: {
      type: String,
      enum: ["SCHEDULED", "IN_PROGRESS", "SUBMITTED", "TIMED_OUT", "EVALUATED"],
      default: "SCHEDULED"
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
      immutable: true
    },
    startedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    clientIp: {
      type: String,
      default: "",
      trim: true
    },
    associatedSessionId: {
      type: String,
      default: "",
      trim: true
    },
    migrationCount: {
      type: Number,
      default: 0
    },
    lastMigrationAt: {
      type: Date,
      default: null
    },
    migrationHistory: [migrationRecordSchema],
    lastHeartbeatAt: {
      type: Date,
      default: Date.now
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
      min: 0
    },
    paletteState: {
      type: Map,
      of: String,
      default: () => new Map<string, string>()
    },
    lastSavedAt: {
      type: Date,
      default: Date.now
    },
    shuffledQuestions: [shuffledQuestionSchema]
  },
  {
    timestamps: true,
    strict: true
  }
);

// Guarantee single active session per student per test (Rule LIVE-004)
testSessionSchema.index({ userId: 1, testId: 1 }, { unique: true });
testSessionSchema.index({ status: 1, expiresAt: 1 });

export const TestSessionModel: Model<ITestSession> = mongoose.model<ITestSession>(
  "TestSession",
  testSessionSchema
);
export default TestSessionModel;
