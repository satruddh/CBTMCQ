import { Request, Response } from "express";
import { loginService, ILoginResult } from "../services/loginService";
import { IAuthUser } from "../../../types/express";

export const loginPostHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const username: string = req.body.username ? String(req.body.username).trim() : "";
    const password: string = req.body.password ? String(req.body.password).trim() : "";
    const role: string = req.body.role ? String(req.body.role).trim() : "";

    if (username.length === 0 || password.length === 0 || role.length === 0) {
      res.status(400).json({
        success: false,
        message: "Username, password, and role are required fields.",
        error: "MISSING_REQUIRED_FIELDS"
      });
      return;
    }

    const clientIp: string = req.ip || req.socket.remoteAddress || "";
    const result: ILoginResult = await loginService(
      username,
      password,
      role,
      req.sessionID,
      clientIp
    );

    if (result.success && result.user) {
      req.session.authenticatedUser = {
        user: result.user as unknown as IAuthUser
      };
      req.session.isAuthenticated = true;

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
          isExamMigrated: result.isExamMigrated
        }
      });
      return;
    }

    if (result.error === "EXCESSIVE_MIGRATIONS_LOCKED") {
      res.status(403).json({
        success: false,
        message: result.message,
        error: result.error
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: result.message,
      error: result.error
    });
  } catch (error) {
    console.error("Login controller error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login.",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

export const loginGetHandler = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: "Login service active."
  });
};
