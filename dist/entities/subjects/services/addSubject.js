"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSubject = void 0;
const Subject_1 = __importDefault(require("../../../database/models/Subject"));
const User_1 = __importDefault(require("../../../database/models/User"));
const addSubject = async (data) => {
    try {
        const user = await User_1.default.findById(data.createdBy);
        if (!user) {
            return {
                success: false,
                message: "Creator user account not found.",
                subject: null,
                error: "USER_NOT_FOUND"
            };
        }
        const newSubject = new Subject_1.default({
            subjectCode: data.subjectCode.trim(),
            subjectName: data.subjectName.trim(),
            description: data.description ? data.description.trim() : "",
            academicYear: data.academicYear,
            credits: data.credits ? data.credits : 4,
            createdBy: user._id
        });
        await newSubject.save();
        return {
            success: true,
            message: "Subject added successfully.",
            subject: newSubject.toJSON(),
            error: ""
        };
    }
    catch (error) {
        const errMessage = error instanceof Error ? error.message : "Error adding subject";
        return {
            success: false,
            message: errMessage,
            subject: null,
            error: "SAVE_FAILED"
        };
    }
};
exports.addSubject = addSubject;
