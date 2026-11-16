"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuestionsHandler = exports.addQuestionHandlerPost = void 0;
const addQuestion_1 = require("../services/addQuestion");
const addQuestionHandlerPost = async (req, res) => {
    try {
        const { subject, subjectId, questionText, questionType, difficulty, options } = req.body;
        const targetSubjectId = subjectId || subject || "";
        const createdBy = req.body.createdBy
            ? String(req.body.createdBy)
            : req.user
                ? req.user._id
                : "";
        if (!targetSubjectId || !questionText || !options || !createdBy) {
            res.status(400).json({
                success: false,
                message: "Missing required fields: subjectId, questionText, options, createdBy",
                error: "MISSING_REQUIRED_FIELDS"
            });
            return;
        }
        const result = await (0, addQuestion_1.addQuestion)({
            subjectId: targetSubjectId,
            questionText: String(questionText),
            questionType,
            difficulty,
            options,
            createdBy
        });
        if (result.success) {
            res.status(201).json({
                success: true,
                message: result.message,
                data: result.question
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
        console.error("Error in addQuestion controller:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error adding question.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.addQuestionHandlerPost = addQuestionHandlerPost;
const getQuestionsHandler = async (req, res) => {
    try {
        const subjectId = req.query.subjectId ? String(req.query.subjectId) : "";
        if (subjectId.length === 0) {
            res.status(400).json({
                success: false,
                message: "Query parameter subjectId is required.",
                error: "MISSING_SUBJECT_ID"
            });
            return;
        }
        const result = await (0, addQuestion_1.getQuestionsBySubject)(subjectId);
        res.status(200).json({
            success: true,
            questions: result.questions
        });
    }
    catch (error) {
        console.error("Error in getQuestions controller:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error retrieving questions.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.getQuestionsHandler = getQuestionsHandler;
