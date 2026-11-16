import bcrypt from "bcrypt";
import UserModel, { IUser } from "../../../database/models/User";

export interface ISignupPayload {
  username: string;
  name: string;
  email: string;
  password?: string;
  role?: "ADMIN" | "FACULTY" | "STUDENT";
  academicYear?: number;
  mobileNumber: string;
}

export interface ISignupResult {
  success: boolean;
  message: string;
  user: Record<string, unknown> | null;
  error: string;
}

export const signupService = async (payload: ISignupPayload): Promise<ISignupResult> => {
  try {
    const existingEmail: IUser | null = await UserModel.findOne({
      email: payload.email.trim().toLowerCase()
    });
    if (existingEmail) {
      return {
        success: false,
        message: "A user with this email already exists.",
        user: null,
        error: "EMAIL_ALREADY_EXISTS"
      };
    }

    const existingUsername: IUser | null = await UserModel.findOne({
      username: payload.username.trim()
    });
    if (existingUsername) {
      return {
        success: false,
        message: "A user with this username already exists.",
        user: null,
        error: "USERNAME_ALREADY_EXISTS"
      };
    }

    const saltRounds: number = 10;
    const hashedPassword: string = await bcrypt.hash(
      payload.password ? payload.password.trim() : "",
      saltRounds
    );

    const newUser: IUser = new UserModel({
      username: payload.username.trim(),
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      password: hashedPassword,
      role: payload.role ? payload.role : "STUDENT",
      academicYear: payload.academicYear ? payload.academicYear : 1,
      mobileNumber: payload.mobileNumber ? payload.mobileNumber.trim() : ""
    });

    await newUser.save();

    return {
      success: true,
      message: "User registered successfully.",
      user: newUser.toJSON(),
      error: ""
    };
  } catch (error) {
    console.error("Signup service error:", error);
    return {
      success: false,
      message: "Failed to register user.",
      user: null,
      error: "INTERNAL_ERROR"
    };
  }
};
