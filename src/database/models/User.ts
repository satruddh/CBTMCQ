import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  name: string;
  email: string;
  password?: string;
  role: "ADMIN" | "FACULTY" | "STUDENT";
  academicYear: number;
  isActive: boolean;
  mobileNumber: string;
  resetPasswordToken: string | null;
  activeSessionId: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema<IUser> = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, immutable: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "FACULTY", "STUDENT"], default: "STUDENT" },
    academicYear: { type: Number, enum: [1, 2, 3, 4, 5], default: 1 },
    isActive: { type: Boolean, default: true },
    mobileNumber: { type: String, required: true, trim: true },
    resetPasswordToken: { type: String, default: null },
    activeSessionId: { type: String, default: null },
    lastLoginAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    strict: true
  }
);

// Privacy transform: strip password, tokens, and internal metadata (Rule DB-006)
userSchema.set("toJSON", {
  transform: (_doc: unknown, ret: Record<string, unknown>): Record<string, unknown> => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.__v;
    return ret;
  }
});

export const UserModel: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default UserModel;
