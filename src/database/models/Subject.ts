import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ISubject extends Document {
  subjectCode: string;
  subjectName: string;
  description: string;
  academicYear: number;
  credits: number;
  createdBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema: Schema<ISubject> = new Schema<ISubject>(
  {
    subjectCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      immutable: true
    },
    subjectName: {
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
    credits: {
      type: Number,
      default: 4,
      min: 1
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

export const SubjectModel: Model<ISubject> = mongoose.model<ISubject>("Subject", subjectSchema);
export default SubjectModel;
