import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IOption {
  _id: Types.ObjectId;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface IQuestion extends Document {
  subjectId: Types.ObjectId;
  questionText: string;
  questionType: "MCQ" | "True/False" | "MSQ";
  options: Types.DocumentArray<IOption>;
  difficulty: {
    level: "Easy" | "Medium" | "Hard";
    weight: number;
  };
  usageCount: number;
  lastUsed: Date | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema: Schema<IOption> = new Schema<IOption>(
  {
    text: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, required: true, default: false },
    explanation: { type: String, default: "", trim: true }
  },
  { _id: true }
);

const questionSchema: Schema<IQuestion> = new Schema<IQuestion>(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      immutable: true
    },
    questionText: {
      type: String,
      required: true,
      trim: true
    },
    questionType: {
      type: String,
      enum: ["MCQ", "True/False", "MSQ"],
      default: "MCQ"
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (opts: Array<IOption>): boolean => opts.length >= 2,
        message: "A question must contain at least 2 options."
      }
    },
    difficulty: {
      level: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        default: "Medium"
      },
      weight: {
        type: Number,
        default: 1.0
      }
    },
    usageCount: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date,
      default: null
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

// Automatic weight calculation hook (Rule DB-005)
questionSchema.pre<IQuestion>("save", function (next: () => void): void {
  if (this.difficulty.level === "Easy") {
    this.difficulty.weight = 0.8;
  } else if (this.difficulty.level === "Hard") {
    this.difficulty.weight = 1.2;
  } else {
    this.difficulty.weight = 1.0;
  }
  next();
});

export const QuestionModel: Model<IQuestion> = mongoose.model<IQuestion>(
  "Question",
  questionSchema
);
export default QuestionModel;
