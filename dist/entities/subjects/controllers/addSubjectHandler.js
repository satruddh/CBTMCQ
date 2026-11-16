"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSubjectHandlerPost = void 0;
const addSubject_1 = require("../services/addSubject");
const addSubjectHandlerPost = async (req, res) => {
    try {
        const subjectName = req.body.subjectName ? String(req.body.subjectName).trim() : "";
        const subjectCode = req.body.subjectCode ? String(req.body.subjectCode).trim() : "";
        const academicYear = Number(req.body.academicYear);
        const createdBy = req.body.createdBy
            ? String(req.body.createdBy)
            : req.user
                ? req.user._id
                : "";
        const credits = req.body.credits ? Number(req.body.credits) : 4;
        const description = req.body.description ? String(req.body.description).trim() : "";
        if (!subjectCode || !subjectName || !academicYear || !createdBy) {
            res.status(400).json({
                success: false,
                message: "Missing required fields: subjectCode, subjectName, academicYear, createdBy",
                error: "MISSING_REQUIRED_FIELDS"
            });
            return;
        }
        const result = await (0, addSubject_1.addSubject)({
            subjectCode,
            subjectName,
            academicYear,
            createdBy,
            credits,
            description
        });
        if (result.success) {
            res.status(201).json({
                success: true,
                message: result.message,
                data: result.subject
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
        console.error("Error in addSubject controller:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error adding subject.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.addSubjectHandlerPost = addSubjectHandlerPost;
