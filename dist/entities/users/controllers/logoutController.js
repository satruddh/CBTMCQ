"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutHandler = void 0;
const logoutHandler = async (req, res) => {
    try {
        req.session.destroy((err) => {
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
    }
    catch (error) {
        console.error("Logout exception:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during logout.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.logoutHandler = logoutHandler;
