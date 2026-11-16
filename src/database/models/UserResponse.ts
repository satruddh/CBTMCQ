import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IUserResponse extends Document {
  userId: Types.ObjectId;
  testQuestionId: Types.ObjectId;
  selectedOptionIds: Array<Types.ObjectId>;
  status: "ATTEMPTED" | "UNATTEMPTED" | "MARKED_REVIEW";
  timeSpent: number;
  isCorrect: boolean | null;
  marksObtained: number;
  createdAt: Date;
  updatedAt: Date;
}

const userResponseSchema: Schema<IUserResponse> = new Schema<IUserResponse>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true
    },
    testQuestionId: {
      type: Schema.Types.ObjectId,
      ref: "TestQuestion",
      required: true,
      immutable: true
    },
    selectedOptionIds: [
      {
        type: Schema.Types.ObjectId
      }
    ],
    status: {
      type: String,
      enum: ["ATTEMPTED", "UNATTEMPTED", "MARKED_REVIEW"],
      default: "UNATTEMPTED"
    },
    timeSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    isCorrect: {
      type: Boolean,
      default: null
    },
    marksObtained: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

// Idempotent upsert index (Rule DB-004 / LIVE-005)
userResponseSchema.index({ userId: 1, testQuestionId: 1 }, { unique: true });

export const UserResponseModel: Model<IUserResponse> = mongoose.model<IUserResponse>(
  "UserResponse",
  userResponseSchema
);
export default UserResponseModel;
