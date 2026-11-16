import bcrypt from "bcrypt";
import UserModel, { IUser } from "../../../database/models/User";
import TestSessionModel from "../../../database/models/TestSession";

export interface ILoginResult {
  success: boolean;
  message: string;
  user: Record<string, unknown> | null;
  error: string;
  isExamMigrated: boolean;
}

export const loginService = async (
  username: string,
  plainTextPassword: string,
  userRole: string,
  newSessionId: string,
  clientIp: string = ""
): Promise<ILoginResult> => {
  try {
    const userDoc: IUser | null = await UserModel.findOne({
      username: username.trim()
    });

    if (!userDoc || !userDoc.password) {
      return {
        success: false,
        message: "Invalid credentials.",
        user: null,
        error: "INVALID_CREDENTIALS",
        isExamMigrated: false
      };
    }

    const isMatch: boolean = await bcrypt.compare(plainTextPassword.trim(), userDoc.password);
    if (!isMatch) {
      return {
        success: false,
        message: "Invalid credentials.",
        user: null,
        error: "INVALID_CREDENTIALS",
        isExamMigrated: false
      };
    }

    if (userDoc.role !== userRole.trim().toUpperCase()) {
      return {
        success: false,
        message: `Account role '${userDoc.role}' does not match requested '${userRole}'.`,
        user: null,
        error: "ROLE_MISMATCH",
        isExamMigrated: false
      };
    }

    let isExamMigrated: boolean = false;

    // Check for Active Live Exam Takeover (Rule LIVE-008)
    const activeTestSession = await TestSessionModel.findOne({
      userId: userDoc._id,
      status: "IN_PROGRESS"
    });

    if (activeTestSession) {
      // If logging in from a different session while exam is active
      if (activeTestSession.associatedSessionId !== newSessionId) {
        if (activeTestSession.migrationCount >= 3) {
          return {
            success: false,
            message:
              "Device migration limit exceeded (max 3 switches allowed). Please contact your exam proctor for authorization.",
            user: null,
            error: "EXCESSIVE_MIGRATIONS_LOCKED",
            isExamMigrated: false
          };
        }

        // Perform atomic takeover: record migration audit entry
        activeTestSession.migrationHistory.push({
          fromSessionId: activeTestSession.associatedSessionId,
          toSessionId: newSessionId,
          fromIp: activeTestSession.clientIp,
          toIp: clientIp,
          migratedAt: new Date()
        });
        activeTestSession.migrationCount += 1;
        activeTestSession.lastMigrationAt = new Date();
        activeTestSession.associatedSessionId = newSessionId;
        activeTestSession.clientIp = clientIp;
        await activeTestSession.save();

        isExamMigrated = true;
      }
    }

    // Update user single active session binding
    userDoc.activeSessionId = newSessionId;
    userDoc.lastLoginAt = new Date();
    await userDoc.save();

    // Strip password via toJSON
    const userJson: Record<string, unknown> = userDoc.toJSON();

    return {
      success: true,
      message: isExamMigrated
        ? "Login successful. Active exam session migrated to this device."
        : "Login successful.",
      user: userJson,
      error: "",
      isExamMigrated
    };
  } catch (error) {
    console.error("Login service error:", error);
    return {
      success: false,
      message: "An error occurred during authentication.",
      user: null,
      error: "INTERNAL_ERROR",
      isExamMigrated: false
    };
  }
};
