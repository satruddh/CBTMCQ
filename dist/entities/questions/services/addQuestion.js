"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuestionsBySubject = exports.addQuestion = void 0;
const Question_1 = __importDefault(require("../../../database/models/Question"));
const mongoose_1 = require("mongoose");
const addQuestion = async (payload) => {
    try {
        if (!payload.options || payload.options.length < 2) {
            return {
                success: false,
                message: "Question must have at least 2 options.",
                question: null,
                error: "INSUFFICIENT_OPTIONS"
            };
        }
        const hasCorrect = payload.options.some((opt) => opt.isCorrect);
        if (!hasCorrect) {
            return {
                success: false,
                message: "Question must have at least one correct option.",
                question: null,
                error: "NO_CORRECT_OPTION"
            };
        }
        const newQuestion = new Question_1.default({
            subjectId: new mongoose_1.Types.ObjectId(payload.subjectId),
            questionText: payload.questionText.trim(),
            questionType: payload.questionType ? payload.questionType : "MCQ",
            difficulty: {
                level: payload.difficulty ? payload.difficulty : "Medium",
                weight: payload.difficulty === "Easy" ? 0.8 : payload.difficulty === "Hard" ? 1.2 : 1.0
            },
            options: payload.options.map((opt) => ({
                _id: new mongoose_1.Types.ObjectId(),
                text: opt.text.trim(),
                isCorrect: opt.isCorrect,
                explanation: opt.explanation ? opt.explanation.trim() : ""
            })),
            createdBy: new mongoose_1.Types.ObjectId(payload.createdBy)
        });
        await newQuestion.save();
        return {
            success: true,
            message: "Question added successfully.",
            question: newQuestion.toJSON(),
            error: ""
        };
    }
    catch (error) {
        console.error("Error adding question:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Error adding question",
            question: null,
            error: "SAVE_QUESTION_FAILED"
        };
    }
};
exports.addQuestion = addQuestion;
const getQuestionsBySubject = async (subjectId) => {
    try {
        const questions = await Question_1.default.find({
            subjectId: new mongoose_1.Types.ObjectId(subjectId)
        }).limit(100);
        return { success: true, questions };
    }
    catch (error) {
        console.error("Error fetching questions:", error);
        return { success: false, questions: new Array() };
    }
};
exports.getQuestionsBySubject = getQuestionsBySubject;
