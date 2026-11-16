import { Request, Response, NextFunction } from "express";
import { UserModel, IUser } from "../database/models/User";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionUser = req.session.authenticatedUser?.user;
    const isAuthenticated = req.session.isAuthenticated;

    if (!isAuthenticated || !sessionUser) {
      next();
      return;
    }

    // Verify Single-Login Concurrency (Rule LIVE-008)
    const userDoc: IUser | null = await UserModel.findById(sessionUser._id).select(
      "activeSessionId isActive role academicYear username name email"
    );

    if (!userDoc || !userDoc.isActive) {
      req.session.destroy(() => {});
      res.status(401).json({
        success: false,
        message: "Account is inactive or user not found.",
        error: "ACCOUNT_INACTIVE"
      });
      return;
    }

    // Check if session was preempted by a newer login from another workstation
    if (userDoc.activeSessionId && userDoc.activeSessionId !== req.sessionID) {
      req.session.destroy(() => {});
      res.status(401).json({
        success: false,
        message:
          "Your session was transferred to another device. If this was not you, contact your exam proctor immediately.",
        error: "SESSION_REVOKED_BY_NEW_LOGIN"
      });
      return;
    }

    req.user = {
      _id: String(userDoc._id),
      username: userDoc.username,
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      academicYear: userDoc.academicYear
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    next();
  }
};
