"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = __importDefault(require("../../../database/models/User"));
const signupService = async (payload) => {
    try {
        const existingEmail = await User_1.default.findOne({
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
        const existingUsername = await User_1.default.findOne({
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
        const saltRounds = 10;
        const hashedPassword = await bcrypt_1.default.hash(payload.password ? payload.password.trim() : "", saltRounds);
        const newUser = new User_1.default({
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
    }
    catch (error) {
        console.error("Signup service error:", error);
        return {
            success: false,
            message: "Failed to register user.",
            user: null,
            error: "INTERNAL_ERROR"
        };
    }
};
exports.signupService = signupService;
