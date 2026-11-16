"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeFlatViewQuery = void 0;
const TestResult_1 = __importDefault(require("../../../database/models/TestResult"));
const Test_1 = __importDefault(require("../../../database/models/Test"));
const Question_1 = __importDefault(require("../../../database/models/Question"));
const UserResponse_1 = __importDefault(require("../../../database/models/UserResponse"));
const VIEW_REGISTRY = {
    "test-sessions": {
        sourceModel: Test_1.default,
        allowedFields: [
            "testName",
            "academicYear",
            "testType",
            "totalMarks",
            "duration",
            "passingScore",
            "schedule",
            "facultyName",
            "subjectNames"
        ],
        defaultSort: { "schedule.startTime": -1 },
        basePipeline: (userScoping) => {
            const pipeline = [
                { $match: { isActive: true, ...userScoping } },
                {
                    $lookup: {
                        from: "users",
                        localField: "createdBy",
                        foreignField: "_id",
                        as: "creator"
                    }
                },
                { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "subjects",
                        localField: "subjects",
                        foreignField: "_id",
                        as: "subjectDocs"
                    }
                },
                {
                    $addFields: {
                        facultyName: "$creator.name",
                        subjectNames: {
                            $map: { input: "$subjectDocs", as: "sub", in: "$$sub.subjectName" }
                        }
                    }
                }
            ];
            return pipeline;
        }
    },
    "student-results": {
        sourceModel: TestResult_1.default,
        allowedFields: [
            "studentName",
            "testName",
            "totalMarksObtained",
            "percentage",
            "completedAt",
            "subjectBreakdown"
        ],
        defaultSort: { completedAt: -1 },
        basePipeline: (userScoping) => {
            const pipeline = [
                { $match: userScoping },
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "student"
                    }
                },
                { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "tests",
                        localField: "testId",
                        foreignField: "_id",
                        as: "testDoc"
                    }
                },
                { $unwind: { path: "$testDoc", preserveNullAndEmptyArrays: true } },
                {
                    $addFields: {
                        studentName: "$student.name",
                        testName: "$testDoc.testName"
                    }
                }
            ];
            return pipeline;
        }
    },
    "question-bank-overview": {
        sourceModel: Question_1.default,
        allowedFields: [
            "questionText",
            "questionType",
            "difficultyLevel",
            "difficultyWeight",
            "subjectName",
            "authorName",
            "usageCount"
        ],
        defaultSort: { createdAt: -1 },
        basePipeline: (_userScoping) => {
            const pipeline = [
                {
                    $lookup: {
                        from: "subjects",
                        localField: "subjectId",
                        foreignField: "_id",
                        as: "subject"
                    }
                },
                { $unwind: { path: "$subject", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "users",
                        localField: "createdBy",
                        foreignField: "_id",
                        as: "author"
                    }
                },
                { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
                {
                    $addFields: {
                        subjectName: "$subject.subjectName",
                        authorName: "$author.name",
                        difficultyLevel: "$difficulty.level",
                        difficultyWeight: "$difficulty.weight"
                    }
                }
            ];
            return pipeline;
        }
    },
    "exam-monitoring": {
        sourceModel: UserResponse_1.default,
        allowedFields: [
            "studentName",
            "status",
            "timeSpent",
            "isCorrect",
            "marksObtained",
            "testQuestionId"
        ],
        defaultSort: { updatedAt: -1 },
        basePipeline: (userScoping) => {
            const pipeline = [
                { $match: userScoping },
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "student"
                    }
                },
                { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
                {
                    $addFields: {
                        studentName: "$student.name"
                    }
                }
            ];
            return pipeline;
        }
    },
    "test-leaderboard": {
        sourceModel: TestResult_1.default,
        allowedFields: [
            "rank",
            "studentName",
            "username",
            "testName",
            "score",
            "percentage",
            "totalMarks",
            "completedAt",
            "passed",
            "testId",
            "userId"
        ],
        defaultSort: { rank: 1 },
        basePipeline: (userScoping) => {
            const pipeline = [
                { $match: userScoping },
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "student"
                    }
                },
                { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "tests",
                        localField: "testId",
                        foreignField: "_id",
                        as: "testDoc"
                    }
                },
                { $unwind: { path: "$testDoc", preserveNullAndEmptyArrays: true } },
                {
                    $setWindowFields: {
                        sortBy: { score: -1, completedAt: 1 },
                        output: {
                            rank: { $denseRank: {} }
                        }
                    }
                },
                {
                    $addFields: {
                        studentName: "$student.name",
                        username: "$student.username",
                        testName: "$testDoc.testName",
                        totalMarks: "$testDoc.totalMarks"
                    }
                }
            ];
            return pipeline;
        }
    }
};
const executeFlatViewQuery = async (viewName, userScoping, selectFields, orderBy, limitNum = 20, skipNum = 0) => {
    const config = VIEW_REGISTRY[viewName];
    if (!config) {
        throw new Error(`View '${viewName}' is not registered.`);
    }
    // 1. Build Base Pipeline with Match-First Principle (Rule VIEW-004)
    const pipeline = config.basePipeline(userScoping);
    // 2. Validate Whitelist for Projections (Rule VIEW-002)
    if (selectFields && selectFields.length > 0) {
        const projectStage = { _id: 1 };
        for (const field of selectFields) {
            if (!config.allowedFields.includes(field)) {
                throw new Error(`Field '${field}' is not queryable on view '${viewName}'. Allowed: ${config.allowedFields.join(", ")}`);
            }
            projectStage[field] = 1;
        }
        pipeline.push({ $project: projectStage });
    }
    // 3. Sorting
    if (orderBy && orderBy.length > 0) {
        const [field, direction] = orderBy.split(":");
        if (field && config.allowedFields.includes(field)) {
            const sortDir = direction?.toLowerCase() === "asc" ? 1 : -1;
            pipeline.push({ $sort: { [field]: sortDir } });
        }
    }
    else {
        pipeline.push({ $sort: config.defaultSort });
    }
    // 4. Pagination (Max 100 per Rule DDOS-004 / VIEW-001)
    const finalLimit = Math.min(Math.max(1, limitNum), 100);
    pipeline.push({ $skip: Math.max(0, skipNum) });
    pipeline.push({ $limit: finalLimit });
    const data = await config.sourceModel.aggregate(pipeline);
    return { success: true, data, count: data.length };
};
exports.executeFlatViewQuery = executeFlatViewQuery;
