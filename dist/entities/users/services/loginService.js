"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = __importDefault(require("../../../database/models/User"));
const TestSession_1 = __importDefault(require("../../../database/models/TestSession"));
const loginService = async (username, plainTextPassword, userRole, newSessionId, clientIp = "") => {
    try {
        const userDoc = await User_1.default.findOne({
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
        const isMatch = await bcrypt_1.default.compare(plainTextPassword.trim(), userDoc.password);
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
        let isExamMigrated = false;
        // Check for Active Live Exam Takeover (Rule LIVE-008)
        const activeTestSession = await TestSession_1.default.findOne({
            userId: userDoc._id,
            status: "IN_PROGRESS"
        });
        if (activeTestSession) {
            // If logging in from a different session while exam is active
            if (activeTestSession.associatedSessionId !== newSessionId) {
                if (activeTestSession.migrationCount >= 3) {
                    return {
                        success: false,
                        message: "Device migration limit exceeded (max 3 switches allowed). Please contact your exam proctor for authorization.",
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
        const userJson = userDoc.toJSON();
        return {
            success: true,
            message: isExamMigrated
                ? "Login successful. Active exam session migrated to this device."
                : "Login successful.",
            user: userJson,
            error: "",
            isExamMigrated
        };
    }
    catch (error) {
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
exports.loginService = loginService;
