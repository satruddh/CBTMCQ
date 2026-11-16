"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubjectsHandlerPost = void 0;
const getSubjects_1 = require("../services/getSubjects");
const getSubjectsHandlerPost = async (req, res) => {
    try {
        const userId = req.body.userID ? String(req.body.userID) : req.user ? req.user._id : "";
        const academicYear = req.body.academicYear
            ? Number(req.body.academicYear)
            : undefined;
        const result = await (0, getSubjects_1.getSubjects)(userId.length > 0 ? userId : undefined, academicYear);
        res.status(200).json({
            success: true,
            message: result.message,
            subjects: result.subjects
        });
    }
    catch (error) {
        console.error("Error retrieving subjects:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error retrieving subjects.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.getSubjectsHandlerPost = getSubjectsHandlerPost;
