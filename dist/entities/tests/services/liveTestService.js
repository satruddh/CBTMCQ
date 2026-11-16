"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestReviewService = exports.submitAndGradeTest = exports.saveAnswerResponse = exports.saveProgressService = exports.startOrResumeSession = exports.bulkEnrollStudentsService = exports.enrollStudentService = exports.getAvailableTestsForStudent = exports.getTestsService = exports.createTestService = void 0;
const mongoose_1 = require("mongoose");
const Test_1 = __importDefault(require("../../../database/models/Test"));
const TestQuestion_1 = __importDefault(require("../../../database/models/TestQuestion"));
const Question_1 = __importDefault(require("../../../database/models/Question"));
const TestSession_1 = __importDefault(require("../../../database/models/TestSession"));
const UserResponse_1 = __importDefault(require("../../../database/models/UserResponse"));
const TestResult_1 = __importDefault(require("../../../database/models/TestResult"));
// Fisher-Yates in-place shuffle helper
const shuffleArray = (array) => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = result[i];
        result[i] = result[j];
        result[j] = temp;
    }
    return result;
};
// 1. Create Test (Powers cbtmcq-ui AddTest.jsx)
const createTestService = async (payload) => {
    const startTimeDate = new Date(payload.startTime);
    let endTimeDate;
    if (payload.endTime && String(payload.endTime).trim().length > 0) {
        endTimeDate = new Date(payload.endTime);
    }
    else {
        // If endTime omitted, default window to startTime + duration
        endTimeDate = new Date(startTimeDate.getTime() + payload.duration * 60 * 1000);
    }
    const subjectObjectIds = payload.subjects.map((id) => new mongoose_1.Types.ObjectId(id));
    const newTest = new Test_1.default({
        testName: payload.testName.trim(),
        description: payload.description ? payload.description.trim() : "",
        academicYear: Number(payload.academicYear),
        subjects: subjectObjectIds,
        testType: payload.testType,
        totalMarks: Number(payload.totalMarks),
        duration: Number(payload.duration),
        passingScore: payload.passingScore ? Number(payload.passingScore) : 40,
        schedule: {
            startTime: startTimeDate,
            endTime: endTimeDate
        },
        isActive: payload.isActive !== undefined ? payload.isActive : true,
        isPublished: payload.isPublished !== undefined ? payload.isPublished : true,
        createdBy: new mongoose_1.Types.ObjectId(payload.createdBy)
    });
    await newTest.save();
    return newTest;
};
exports.createTestService = createTestService;
// 2. Get Tests (Admin / Faculty listing)
const getTestsService = async (filter = {}) => {
    const tests = await Test_1.default.find(filter)
        .populate("subjects", "subjectCode subjectName")
        .populate("createdBy", "name username email")
        .sort({ "schedule.startTime": -1 })
        .limit(100);
    return tests;
};
exports.getTestsService = getTestsService;
// 3. Get Published Tests Available for Student Enrollment
const getAvailableTestsForStudent = async (userIdStr, academicYear) => {
    const userId = new mongoose_1.Types.ObjectId(userIdStr);
    const tests = await Test_1.default.find({
        academicYear,
        isActive: true,
        isPublished: true
    })
        .populate("subjects", "subjectCode subjectName")
        .populate("createdBy", "name")
        .sort({ "schedule.startTime": 1 })
        .limit(100);
    const testIds = tests.map((t) => t._id);
    const enrolledSessions = await TestSession_1.default.find({
        userId,
        testId: { $in: testIds }
    });
    const enrolledMap = new Map();
    enrolledSessions.forEach((s) => enrolledMap.set(String(s.testId), s.status));
    const result = tests.map((test) => {
        const status = enrolledMap.get(String(test._id));
        return {
            _id: test._id,
            testName: test.testName,
            description: test.description,
            academicYear: test.academicYear,
            subjects: test.subjects,
            testType: test.testType,
            totalMarks: test.totalMarks,
            duration: test.duration,
            passingScore: test.passingScore,
            schedule: test.schedule,
            isEnrolled: status !== undefined,
            sessionStatus: status || null
        };
    });
    return result;
};
exports.getAvailableTestsForStudent = getAvailableTestsForStudent;
// 4. Student Self-Enrollment
const enrollStudentService = async (testIdStr, userIdStr) => {
    const testId = new mongoose_1.Types.ObjectId(testIdStr);
    const userId = new mongoose_1.Types.ObjectId(userIdStr);
    const test = await Test_1.default.findById(testId);
    if (!test || !test.isActive) {
        throw new Error("Test not found or inactive.");
    }
    let session = await TestSession_1.default.findOne({ userId, testId });
    if (session) {
        return { success: true, message: "Already enrolled in this test.", session };
    }
    // Pre-create session in SCHEDULED status
    session = new TestSession_1.default({
        userId,
        testId,
        status: "SCHEDULED",
        enrolledAt: new Date(),
        startedAt: null,
        expiresAt: null
    });
    await session.save();
    return { success: true, message: "Enrolled in test successfully.", session };
};
exports.enrollStudentService = enrollStudentService;
// 5. Admin Bulk Student Enrollment
const bulkEnrollStudentsService = async (testIdStr, studentIds) => {
    const testId = new mongoose_1.Types.ObjectId(testIdStr);
    let enrolledCount = 0;
    for (const idStr of studentIds) {
        const userId = new mongoose_1.Types.ObjectId(idStr);
        const existing = await TestSession_1.default.findOne({ userId, testId });
        if (!existing) {
            await new TestSession_1.default({
                userId,
                testId,
                status: "SCHEDULED",
                enrolledAt: new Date(),
                startedAt: null,
                expiresAt: null
            }).save();
            enrolledCount += 1;
        }
    }
    return { success: true, enrolledCount };
};
exports.bulkEnrollStudentsService = bulkEnrollStudentsService;
// Helper: Build Fisher-Yates Shuffled Sequence with both testQuestionId and questionId
const buildShuffledQuestions = async (testId) => {
    const testQuestions = await TestQuestion_1.default.find({ testId }).sort({
        sequenceNumber: 1
    });
    const questionIds = testQuestions.map((tq) => tq.questionId);
    const rawQuestions = await Question_1.default.find({ _id: { $in: questionIds } });
    const questionMap = new Map();
    rawQuestions.forEach((q) => questionMap.set(String(q._id), q));
    const shuffledIndices = shuffleArray(testQuestions);
    const shuffledSequence = new Array();
    for (let i = 0; i < shuffledIndices.length; i++) {
        const tq = shuffledIndices[i];
        const q = questionMap.get(String(tq.questionId));
        const optionIds = q
            ? shuffleArray(q.options.map((opt) => opt._id))
            : new Array();
        shuffledSequence.push({
            testQuestionId: tq._id,
            questionId: tq.questionId,
            sequenceNumber: i + 1,
            optionOrder: optionIds
        });
    }
    return shuffledSequence;
};
// 6. Live Test Start or Resume
const startOrResumeSession = async (testIdStr, userIdStr, sessionId, clientIp = "") => {
    try {
        const testId = new mongoose_1.Types.ObjectId(testIdStr);
        const userId = new mongoose_1.Types.ObjectId(userIdStr);
        const test = await Test_1.default.findById(testId);
        if (!test || !test.isActive) {
            return {
                success: false,
                message: "Test not found or is currently inactive.",
                sessionId: "",
                startedAt: null,
                expiresAt: null,
                remainingSeconds: 0,
                currentQuestionIndex: 0,
                paletteState: {},
                questions: new Array(),
                error: "TEST_NOT_FOUND"
            };
        }
        const now = new Date();
        if (now < test.schedule.startTime) {
            return {
                success: false,
                message: "This test has not started yet.",
                sessionId: "",
                startedAt: null,
                expiresAt: null,
                remainingSeconds: 0,
                currentQuestionIndex: 0,
                paletteState: {},
                questions: new Array(),
                error: "TEST_NOT_STARTED"
            };
        }
        if (now > test.schedule.endTime) {
            return {
                success: false,
                message: "This test schedule window has expired.",
                sessionId: "",
                startedAt: null,
                expiresAt: null,
                remainingSeconds: 0,
                currentQuestionIndex: 0,
                paletteState: {},
                questions: new Array(),
                error: "TEST_WINDOW_EXPIRED"
            };
        }
        const durationMs = test.duration * 60 * 1000;
        const scheduledEndMs = new Date(test.schedule.endTime).getTime();
        const calculatedEndMs = now.getTime() + durationMs;
        const expiresAt = new Date(Math.min(calculatedEndMs, scheduledEndMs));
        let session = await TestSession_1.default.findOne({ userId, testId });
        if (session) {
            if (session.status === "SUBMITTED" || session.status === "EVALUATED") {
                return {
                    success: false,
                    message: "You have already completed and submitted this test.",
                    sessionId: String(session._id),
                    startedAt: session.startedAt,
                    expiresAt: session.expiresAt,
                    remainingSeconds: 0,
                    currentQuestionIndex: session.currentQuestionIndex,
                    paletteState: Object.fromEntries(session.paletteState),
                    questions: new Array(),
                    error: "ALREADY_SUBMITTED"
                };
            }
            // Transition from SCHEDULED -> IN_PROGRESS on test day
            if (session.status === "SCHEDULED") {
                session.status = "IN_PROGRESS";
                session.startedAt = now;
                session.expiresAt = expiresAt;
                session.associatedSessionId = sessionId;
                session.clientIp = clientIp;
                session.shuffledQuestions = await buildShuffledQuestions(testId);
            }
            else {
                // Already IN_PROGRESS: re-bind device session ID
                session.associatedSessionId = sessionId;
                session.clientIp = clientIp;
            }
            session.lastHeartbeatAt = new Date();
            await session.save();
        }
        else {
            // Direct start (open enrollment)
            const shuffledSequence = await buildShuffledQuestions(testId);
            session = new TestSession_1.default({
                userId,
                testId,
                status: "IN_PROGRESS",
                enrolledAt: now,
                startedAt: now,
                expiresAt,
                associatedSessionId: sessionId,
                clientIp,
                currentQuestionIndex: 0,
                paletteState: new Map(),
                shuffledQuestions: shuffledSequence
            });
            await session.save();
        }
        // Zero-Knowledge Option Projection (Rule LIVE-001)
        const remainingSeconds = session.expiresAt
            ? Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000))
            : 0;
        const testQuestionsMap = new Map();
        const allTqs = await TestQuestion_1.default.find({ testId });
        allTqs.forEach((tq) => testQuestionsMap.set(String(tq._id), tq));
        const qIds = session.shuffledQuestions.map((sq) => sq.questionId);
        const questionsDb = await Question_1.default.find({ _id: { $in: qIds } });
        const questionsLookup = new Map();
        questionsDb.forEach((q) => questionsLookup.set(String(q._id), q));
        const clientQuestions = new Array();
        for (const sq of session.shuffledQuestions) {
            const qDoc = questionsLookup.get(String(sq.questionId));
            const tqDoc = testQuestionsMap.get(String(sq.testQuestionId));
            if (!qDoc)
                continue;
            const optMap = new Map();
            qDoc.options.forEach((opt) => optMap.set(String(opt._id), opt));
            const clientOptions = new Array();
            for (const optId of sq.optionOrder) {
                const optionDoc = optMap.get(String(optId));
                if (optionDoc) {
                    clientOptions.push({
                        _id: String(optionDoc._id),
                        text: optionDoc.text
                    });
                }
            }
            clientQuestions.push({
                testQuestionId: String(sq.testQuestionId),
                questionId: String(qDoc._id),
                sequenceNumber: sq.sequenceNumber,
                questionText: qDoc.questionText,
                questionType: qDoc.questionType,
                assignedMarks: tqDoc ? tqDoc.assignedMarks : 1,
                options: clientOptions
            });
        }
        return {
            success: true,
            message: "Test session active.",
            sessionId: String(session._id),
            startedAt: session.startedAt,
            expiresAt: session.expiresAt,
            remainingSeconds,
            currentQuestionIndex: session.currentQuestionIndex,
            paletteState: Object.fromEntries(session.paletteState),
            questions: clientQuestions,
            error: ""
        };
    }
    catch (error) {
        console.error("Error starting live test session:", error);
        return {
            success: false,
            message: "Failed to initialize live test session.",
            sessionId: "",
            startedAt: null,
            expiresAt: null,
            remainingSeconds: 0,
            currentQuestionIndex: 0,
            paletteState: {},
            questions: new Array(),
            error: "INTERNAL_ERROR"
        };
    }
};
exports.startOrResumeSession = startOrResumeSession;
const saveProgressService = async (testIdStr, userIdStr, currentQuestionIndex, paletteState) => {
    const testId = new mongoose_1.Types.ObjectId(testIdStr);
    const userId = new mongoose_1.Types.ObjectId(userIdStr);
    const session = await TestSession_1.default.findOne({
        userId,
        testId,
        status: "IN_PROGRESS"
    });
    if (!session) {
        throw new Error("Active test session not found.");
    }
    session.currentQuestionIndex = currentQuestionIndex;
    if (paletteState) {
        for (const [k, v] of Object.entries(paletteState)) {
            session.paletteState.set(k, v);
        }
    }
    session.lastSavedAt = new Date();
    await session.save();
    return { success: true, message: "Progress saved.", lastSavedAt: session.lastSavedAt };
};
exports.saveProgressService = saveProgressService;
const saveAnswerResponse = async (userIdStr, testQuestionIdStr, selectedOptionIds, status, timeSpent) => {
    const userId = new mongoose_1.Types.ObjectId(userIdStr);
    const testQuestionId = new mongoose_1.Types.ObjectId(testQuestionIdStr);
    const optionObjectIds = selectedOptionIds.map((id) => new mongoose_1.Types.ObjectId(id));
    const responseDoc = (await UserResponse_1.default.findOneAndUpdate({ userId, testQuestionId }, {
        selectedOptionIds: optionObjectIds,
        status,
        timeSpent: Math.max(0, timeSpent)
    }, { upsert: true, new: true, setDefaultsOnInsert: true }));
    return responseDoc;
};
exports.saveAnswerResponse = saveAnswerResponse;
const submitAndGradeTest = async (testIdStr, userIdStr) => {
    const testId = new mongoose_1.Types.ObjectId(testIdStr);
    const userId = new mongoose_1.Types.ObjectId(userIdStr);
    const test = await Test_1.default.findById(testId);
    const session = await TestSession_1.default.findOne({ userId, testId });
    if (!test || !session) {
        throw new Error("Test or active session not found.");
    }
    if (session.status === "SUBMITTED" || session.status === "EVALUATED") {
        return {
            success: true,
            message: "Test is already submitted.",
            resultWithheldUntil: test.testType === "MOCK" ? null : test.schedule.endTime
        };
    }
    // Grace period 5 seconds
    const nowMs = Date.now();
    const expiryMs = session.expiresAt
        ? new Date(session.expiresAt).getTime() + 5000
        : nowMs + 5000;
    if (nowMs > expiryMs) {
        session.status = "TIMED_OUT";
    }
    else {
        session.status = "SUBMITTED";
    }
    session.submittedAt = new Date();
    await session.save();
    // Server-Side Grading Engine (Rule LIVE-006)
    const testQuestions = await TestQuestion_1.default.find({ testId });
    const questionIds = testQuestions.map((tq) => tq.questionId);
    const questions = await Question_1.default.find({ _id: { $in: questionIds } });
    const qMap = new Map();
    questions.forEach((q) => qMap.set(String(q._id), q));
    const tqMap = new Map();
    testQuestions.forEach((tq) => tqMap.set(String(tq._id), tq));
    const userResponses = await UserResponse_1.default.find({
        userId,
        testQuestionId: { $in: testQuestions.map((tq) => tq._id) }
    });
    const responseMap = new Map();
    userResponses.forEach((ur) => responseMap.set(String(ur.testQuestionId), ur));
    let totalMarksObtained = 0;
    const subjectMap = new Map();
    for (const tq of testQuestions) {
        const q = qMap.get(String(tq.questionId));
        if (!q)
            continue;
        const subKey = String(q.subjectId);
        if (!subjectMap.has(subKey)) {
            subjectMap.set(subKey, { correct: 0, incorrect: 0, unanswered: 0, marks: 0 });
        }
        const subStats = subjectMap.get(subKey);
        const ur = responseMap.get(String(tq._id));
        const correctOptionIds = new Set();
        q.options.forEach((opt) => {
            if (opt.isCorrect)
                correctOptionIds.add(String(opt._id));
        });
        if (!ur || ur.selectedOptionIds.length === 0 || ur.status === "UNATTEMPTED") {
            subStats.unanswered += 1;
            continue;
        }
        const selectedIds = new Set(ur.selectedOptionIds.map((id) => String(id)));
        const isCorrect = correctOptionIds.size === selectedIds.size &&
            [...correctOptionIds].every((id) => selectedIds.has(id));
        ur.isCorrect = isCorrect;
        if (isCorrect) {
            ur.marksObtained = tq.assignedMarks;
            totalMarksObtained += tq.assignedMarks;
            subStats.correct += 1;
            subStats.marks += tq.assignedMarks;
        }
        else {
            ur.marksObtained = 0;
            subStats.incorrect += 1;
        }
        await ur.save();
    }
    const subjectWiseBreakdown = new Array();
    for (const [subId, stats] of subjectMap.entries()) {
        subjectWiseBreakdown.push({
            subjectId: new mongoose_1.Types.ObjectId(subId),
            correct: stats.correct,
            incorrect: stats.incorrect,
            unanswered: stats.unanswered,
            marksObtained: stats.marks
        });
    }
    const percentage = test.totalMarks > 0 ? (totalMarksObtained / test.totalMarks) * 100 : 0;
    await TestResult_1.default.findOneAndUpdate({ userId, testId }, {
        userId,
        testId,
        startedAt: session.startedAt || new Date(),
        completedAt: new Date(),
        totalMarksObtained,
        percentage: Number(percentage.toFixed(2)),
        subjectWiseBreakdown
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
    const resultWithheldUntil = test.testType === "MOCK" ? null : test.schedule.endTime;
    return {
        success: true,
        message: "Test submitted and graded successfully.",
        resultWithheldUntil
    };
};
exports.submitAndGradeTest = submitAndGradeTest;
// 10. Post-Exam Candidate Review with Answer Key and Explanations (Rule LIVE-010)
const getTestReviewService = async (testIdStr, userIdStr) => {
    const testId = new mongoose_1.Types.ObjectId(testIdStr);
    const userId = new mongoose_1.Types.ObjectId(userIdStr);
    const session = await TestSession_1.default.findOne({ userId, testId });
    if (!session) {
        return {
            success: false,
            message: "Test session not found.",
            error: "SESSION_NOT_FOUND"
        };
    }
    if (session.status !== "SUBMITTED" && session.status !== "EVALUATED") {
        return {
            success: false,
            message: "Test session has not been submitted yet.",
            error: "SESSION_NOT_SUBMITTED"
        };
    }
    const test = await Test_1.default.findById(testId);
    if (!test) {
        return {
            success: false,
            message: "Test not found.",
            error: "TEST_NOT_FOUND"
        };
    }
    // Result Release Governance Gate (Rule LIVE-006 / LIVE-010)
    if (test.testType !== "MOCK" && new Date() < new Date(test.schedule.endTime)) {
        return {
            success: false,
            message: "Exam answers and explanations are withheld until the global exam window concludes.",
            error: "RESULT_WITHHELD",
            resultWithheldUntil: test.schedule.endTime
        };
    }
    const result = await TestResult_1.default.findOne({ userId, testId });
    // Map candidate responses
    const testQuestionIds = session.shuffledQuestions.map((sq) => sq.testQuestionId);
    const responses = await UserResponse_1.default.find({
        userId,
        testQuestionId: { $in: testQuestionIds }
    });
    const responseMap = new Map();
    responses.forEach((r) => responseMap.set(String(r.testQuestionId), r));
    // Map canonical questions
    const questionIds = session.shuffledQuestions.map((sq) => sq.questionId);
    const questions = await Question_1.default.find({ _id: { $in: questionIds } });
    const questionMap = new Map();
    questions.forEach((q) => questionMap.set(String(q._id), q));
    // Map test questions for marks
    const testQuestions = await TestQuestion_1.default.find({
        testId,
        _id: { $in: testQuestionIds }
    });
    const tqMap = new Map();
    testQuestions.forEach((tq) => tqMap.set(String(tq._id), tq));
    const reviewQuestions = new Array();
    for (const sq of session.shuffledQuestions) {
        const q = questionMap.get(String(sq.questionId));
        const tq = tqMap.get(String(sq.testQuestionId));
        const resp = responseMap.get(String(sq.testQuestionId));
        const selectedOptionIdStrings = resp
            ? resp.selectedOptionIds.map((id) => String(id))
            : new Array();
        const optMap = new Map();
        if (q) {
            q.options.forEach((opt) => optMap.set(String(opt._id), opt));
        }
        const reviewOptions = new Array();
        for (const optId of sq.optionOrder) {
            const opt = optMap.get(String(optId));
            if (opt) {
                const isSelected = selectedOptionIdStrings.includes(String(opt._id));
                reviewOptions.push({
                    _id: String(opt._id),
                    text: opt.text,
                    isCorrect: Boolean(opt.isCorrect),
                    explanation: opt.explanation || "",
                    isSelected
                });
            }
        }
        const correctOption = q
            ? q.options.find((opt) => opt.isCorrect)
            : undefined;
        const questionExplanation = correctOption ? correctOption.explanation : "";
        reviewQuestions.push({
            testQuestionId: String(sq.testQuestionId),
            questionId: String(sq.questionId),
            sequenceNumber: sq.sequenceNumber,
            questionText: q ? q.questionText : "",
            questionType: q ? q.questionType : "MCQ",
            questionExplanation,
            assignedMarks: tq ? tq.assignedMarks : 1,
            studentStatus: resp ? resp.status : "UNATTEMPTED",
            timeSpent: resp ? resp.timeSpent : 0,
            studentSelectedOptionIds: selectedOptionIdStrings,
            options: reviewOptions
        });
    }
    const marksObtained = result ? result.totalMarksObtained : 0;
    const percentage = result ? result.percentage : 0;
    const passed = marksObtained >= (test.passingScore || 40);
    const reviewData = {
        testId: String(test._id),
        testName: test.testName,
        testType: test.testType,
        totalMarks: test.totalMarks,
        passingScore: test.passingScore || 40,
        totalMarksObtained: marksObtained,
        percentage,
        passed,
        totalQuestions: session.shuffledQuestions.length,
        completedAt: result ? result.completedAt : session.submittedAt,
        subjectWiseBreakdown: result ? result.subjectWiseBreakdown : new Array(),
        questions: reviewQuestions
    };
    return {
        success: true,
        message: "Test review data retrieved successfully.",
        data: reviewData
    };
};
exports.getTestReviewService = getTestReviewService;
