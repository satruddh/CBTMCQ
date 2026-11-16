import { Request, Response } from "express";

export const sessionGetHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.session && req.session.authenticatedUser && req.session.isAuthenticated) {
      res.status(200).json({
        success: true,
        message: "Session exists",
        data: {
          user: req.session.authenticatedUser.user
        }
      });
      return;
    }
    res.status(404).json({
      success: false,
      message: "No active session found.",
      error: "SESSION_NOT_FOUND"
    });
  } catch (error) {
    console.error("Error in sessionController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};
