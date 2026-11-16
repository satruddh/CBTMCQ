"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupPostHandler = void 0;
const signupService_1 = require("../services/signupService");
const signupPostHandler = async (req, res) => {
    try {
        const { username, name, email, password, role, academicYear, mobileNumber } = req.body;
        if (!username || !name || !email || !password || !mobileNumber) {
            res.status(400).json({
                success: false,
                message: "Missing required registration fields.",
                error: "MISSING_REQUIRED_FIELDS"
            });
            return;
        }
        const result = await (0, signupService_1.signupService)({
            username: String(username),
            name: String(name),
            email: String(email),
            password: String(password),
            role: role ? String(role) : "STUDENT",
            academicYear: academicYear ? Number(academicYear) : 1,
            mobileNumber: String(mobileNumber)
        });
        if (result.success) {
            res.status(201).json({
                success: true,
                message: result.message,
                data: result.user
            });
            return;
        }
        res.status(400).json({
            success: false,
            message: result.message,
            error: result.error
        });
    }
    catch (error) {
        console.error("Signup controller error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during user registration.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.signupPostHandler = signupPostHandler;
