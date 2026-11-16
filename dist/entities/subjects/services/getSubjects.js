"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubjects = void 0;
const Subject_1 = __importDefault(require("../../../database/models/Subject"));
const getSubjects = async (userId, academicYear) => {
    try {
        const filter = { isActive: true };
        if (userId) {
            filter.createdBy = userId;
        }
        if (academicYear) {
            filter.academicYear = academicYear;
        }
        // Limit capped at 100 per DDOS Rule DDOS-004
        const subjects = await Subject_1.default.find(filter)
            .populate("createdBy", "username email role academicYear")
            .limit(100);
        return {
            success: true,
            message: "Subjects fetched successfully.",
            subjects
        };
    }
    catch (error) {
        console.error("Error fetching subjects:", error);
        return {
            success: false,
            message: "Failed to fetch subjects.",
            subjects: new Array()
        };
    }
};
exports.getSubjects = getSubjects;
