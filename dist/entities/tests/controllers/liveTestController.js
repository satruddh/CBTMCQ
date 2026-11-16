"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestReviewHandler = exports.submitTestHandler = exports.saveUserResponseHandler = exports.saveProgressHandler = exports.syncSessionHandler = exports.startTestSessionHandler = exports.bulkEnrollStudentsHandler = exports.enrollStudentHandler = exports.getAvailableTestsHandler = exports.getTestsHandler = exports.createTestHandler = void 0;
const liveTestService_1 = require("../services/liveTestService");
const TestSession_1 = __importDefault(require("../../../database/models/TestSession"));
const createTestHandler = async (req, res) => {
    try {
        const { testName, description, academicYear, subjects, testType, totalMarks, duration, passingScore, startTime, endTime, isActive, isPublished } = req.body;
        if (!testName ||
            academicYear === undefined ||
            academicYear === null ||
            !subjects ||
            !testType ||
            totalMarks === undefined ||
            totalMarks === null ||
            duration === undefined ||
            duration === null ||
            !startTime) {
            res.status(400).json({
                success: false,
                message: "Missing required fields for test creation.",
                error: "MISSING_REQUIRED_FIELDS"
            });
            return;
        }
        const createdBy = req.body.createdBy || (req.user ? req.user._id : "");
        if (!createdBy) {
            res.status(400).json({
                success: false,
                message: "createdBy author ID is required.",
                error: "MISSING_CREATED_BY"
            });
            return;
        }
        const newTest = await (0, liveTestService_1.createTestService)({
            testName: String(testName),
            description: description ? String(description) : "",
            academicYear: Number(academicYear),
            subjects: Array.isArray(subjects) ? subjects.map(String) : new Array(),
            testType,
            totalMarks: Number(totalMarks),
            duration: Number(duration),
            passingScore: passingScore !== undefined && passingScore !== null ? Number(passingScore) : 40,
            startTime,
            endTime,
            isActive: isActive !== undefined && isActive !== null ? Boolean(isActive) : true,
            isPublished: isPublished !== undefined && isPublished !== null ? Boolean(isPublished) : true,
            createdBy
        });
        res.status(201).json({
            success: true,
            message: "Test created successfully.",
            data: newTest
        });
    }
    catch (error) {
        console.error("Error in createTestHandler:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error creating test.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.createTestHandler = createTestHandler;
const getTestsHandler = async (req, res) => {
    try {
        const filter = {};
        if (req.query.academicYear) {
            filter.academicYear = Number(req.query.academicYear);
        }
        if (req.query.testType) {
            filter.testType = String(req.query.testType);
        }
        if (req.query.isActive !== undefined && req.query.isActive !== null) {
            filter.isActive = req.query.isActive === "true";
        }
        if (req.query.isPublished !== undefined && req.query.isPublished !== null) {
            filter.isPublished = req.query.isPublished === "true";
        }
        const tests = await (0, liveTestService_1.getTestsService)(filter);
        res.status(200).json({
            success: true,
            data: tests
        });
    }
    catch (error) {
        console.error("Error in getTestsHandler:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error fetching tests.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.getTestsHandler = getTestsHandler;
const getAvailableTestsHandler = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : "";
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required to view available tests.",
                error: "UNAUTHORIZED"
            });
            return;
        }
        const academicYear = req.user && req.user.academicYear ? Number(req.user.academicYear) : 1;
        const availableTests = await (0, liveTestService_1.getAvailableTestsForStudent)(userId, academicYear);
        res.status(200).json({
            success: true,
            data: availableTests
        });
    }
    catch (error) {
        console.error("Error in getAvailableTestsHandler:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error fetching available tests.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.getAvailableTestsHandler = getAvailableTestsHandler;
const enrollStudentHandler = async (req, res) => {
    try {
        const testId = req.params.id ? String(req.params.id) : "";
        const userId = req.user ? req.user._id : "";
        if (!testId || !userId) {
            res.status(400).json({
                success: false,
                message: "Test ID and student authentication are required.",
                error: "MISSING_REQUIRED_PARAMS"
            });
            return;
        }
        const result = await (0, liveTestService_1.enrollStudentService)(testId, userId);
        res.status(200).json({
            success: true,
            message: result.message,
            data: result.session
        });
    }
    catch (error) {
        console.error("Error in enrollStudentHandler:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to enroll in test.";
        res.status(400).json({
            success: false,
            message: errorMessage,
            error: "ENROLLMENT_FAILED"
        });
    }
};
exports.enrollStudentHandler = enrollStudentHandler;
const bulkEnrollStudentsHandler = async (req, res) => {
    try {
        const testId = req.params.id ? String(req.params.id) : "";
        const studentIds = Array.isArray(req.body.studentIds)
            ? req.body.studentIds.map(String)
            : new Array();
        if (!testId || studentIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Test ID and non-empty studentIds array are required.",
                error: "MISSING_REQUIRED_PARAMS"
            });
            return;
        }
        const result = await (0, liveTestService_1.bulkEnrollStudentsService)(testId, studentIds);
        res.status(200).json({
            success: true,
            message: `Enrolled ${result.enrolledCount} students successfully.`,
            data: { enrolledCount: result.enrolledCount }
        });
    }
    catch (error) {
        console.error("Error in bulkEnrollStudentsHandler:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to bulk enroll students.";
        res.status(500).json({
            success: false,
            message: errorMessage,
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.bulkEnrollStudentsHandler = bulkEnrollStudentsHandler;
const startTestSessionHandler = async (req, res) => {
    try {
        const testId = req.params.id ? String(req.params.id) : "";
        const userId = req.user ? req.user._id : "";
        const sessionId = req.sessionID || "";
        const clientIp = req.ip || req.socket.remoteAddress || "";
        if (!testId || !userId) {
            res.status(400).json({
                success: false,
                message: "Test ID and valid user authentication are required.",
                error: "MISSING_REQUIRED_PARAMS"
            });
            return;
        }
        const result = await (0, liveTestService_1.startOrResumeSession)(testId, userId, sessionId, clientIp);
        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    sessionId: result.sessionId,
                    startedAt: result.startedAt,
                    expiresAt: result.expiresAt,
                    remainingSeconds: result.remainingSeconds,
                    currentQuestionIndex: result.currentQuestionIndex,
                    paletteState: result.paletteState,
                    questions: result.questions
                }
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
        console.error("Error in startTestSessionHandler:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error starting test session.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.startTestSessionHandler = startTestSessionHandler;
const syncSessionHandler = async (req, res) => {
    try {
        const testId = req.params.id ? String(req.params.id) : "";
        const userId = req.user ? req.user._id : "";
        const session = await TestSession_1.default.findOne({ userId, testId });
        if (!session) {
            res.status(404).json({
                success: false,
                message: "Active session not found.",
                error: "SESSION_NOT_FOUND"
            });
            return;
        }
        const remainingSeconds = session.expiresAt
            ? Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000))
            : 0;
        res.status(200).json({
            success: true,
            data: {
                serverTime: new Date().toISOString(),
                remainingSeconds,
                status: session.status
            }
        });
    }
    catch (error) {
        console.error("Error in syncSessionHandler:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error syncing session.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.syncSessionHandler = syncSessionHandler;
const saveProgressHandler = async (req, res) => {
    try {
        const testId = req.params.id ? String(req.params.id) : "";
        const userId = req.user ? req.user._id : "";
        const { currentQuestionIndex, paletteState } = req.body;
        if (currentQuestionIndex === undefined || currentQuestionIndex === null) {
            res.status(400).json({
                success: false,
                message: "currentQuestionIndex is required.",
                error: "MISSING_INDEX"
            });
            return;
        }
        const result = await (0, liveTestService_1.saveProgressService)(testId, userId, Number(currentQuestionIndex), paletteState);
        res.status(200).json({
            success: true,
            message: result.message,
            data: { lastSavedAt: result.lastSavedAt }
        });
    }
    catch (error) {
        console.error("Error in saveProgressHandler:", error);
        res.status(500).json({
            success: false,
            message: "Failed to save test progress.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.saveProgressHandler = saveProgressHandler;
const saveUserResponseHandler = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : "";
        const { testQuestionId, selectedOptionIds, status, timeSpent } = req.body;
        if (!testQuestionId) {
            res.status(400).json({
                success: false,
                message: "testQuestionId is required.",
                error: "MISSING_QUESTION_ID"
            });
            return;
        }
        const savedDoc = await (0, liveTestService_1.saveAnswerResponse)(userId, String(testQuestionId), Array.isArray(selectedOptionIds) ? selectedOptionIds : new Array(), status ? status : "ATTEMPTED", timeSpent ? Number(timeSpent) : 0);
        res.status(200).json({
            success: true,
            message: "Answer response recorded.",
            data: savedDoc
        });
    }
    catch (error) {
        console.error("Error in saveUserResponseHandler:", error);
        res.status(500).json({
            success: false,
            message: "Failed to record response.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.saveUserResponseHandler = saveUserResponseHandler;
const submitTestHandler = async (req, res) => {
    try {
        const testId = req.params.id ? String(req.params.id) : "";
        const userId = req.user ? req.user._id : "";
        if (!testId || !userId) {
            res.status(400).json({
                success: false,
                message: "Test ID is required.",
                error: "MISSING_TEST_ID"
            });
            return;
        }
        const result = await (0, liveTestService_1.submitAndGradeTest)(testId, userId);
        res.status(200).json({
            success: true,
            message: result.message,
            data: {
                status: "SUBMITTED",
                resultWithheldUntil: result.resultWithheldUntil
            }
        });
    }
    catch (error) {
        console.error("Error in submitTestHandler:", error);
        res.status(500).json({
            success: false,
            message: "Failed to submit and grade test.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.submitTestHandler = submitTestHandler;
const getTestReviewHandler = async (req, res) => {
    try {
        const testId = req.params.id ? String(req.params.id) : "";
        const userId = req.user ? req.user._id : "";
        if (!testId || !userId) {
            res.status(400).json({
                success: false,
                message: "Test ID and student authentication are required.",
                error: "MISSING_REQUIRED_PARAMS"
            });
            return;
        }
        const result = await (0, liveTestService_1.getTestReviewService)(testId, userId);
        if (result.success && result.data) {
            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data
            });
            return;
        }
        if (result.error === "RESULT_WITHHELD") {
            res.status(403).json({
                success: false,
                message: result.message,
                error: result.error,
                resultWithheldUntil: result.resultWithheldUntil
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
        console.error("Error in getTestReviewHandler:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error retrieving test review.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};
exports.getTestReviewHandler = getTestReviewHandler;
