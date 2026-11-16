import { Request, Response } from "express";

export const logoutHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    req.session.destroy((err: Error | null) => {
      if (err) {
        console.error("Error destroying session:", err);
        res.status(500).json({
          success: false,
          message: "Internal server error during logout.",
          error: "LOGOUT_FAILED"
        });
        return;
      }
      res.clearCookie("connect.sid");
      res.status(200).json({
        success: true,
        message: "Logout successful."
      });
    });
  } catch (error) {
    console.error("Logout exception:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during logout.",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};
