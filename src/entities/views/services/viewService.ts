import { PipelineStage } from "mongoose";
import TestResultModel from "../../../database/models/TestResult";
import TestModel from "../../../database/models/Test";
import QuestionModel from "../../../database/models/Question";
import UserResponseModel from "../../../database/models/UserResponse";

interface IAggregatableModel {
  aggregate(pipeline: Array<PipelineStage>): Promise<Array<Record<string, unknown>>>;
}

interface IViewConfig {
  sourceModel: IAggregatableModel;
  allowedFields: Array<string>;
  defaultSort: Record<string, 1 | -1>;
  basePipeline: (userScoping: Record<string, unknown>) => Array<PipelineStage>;
}

const VIEW_REGISTRY: Record<string, IViewConfig> = {
  "test-sessions": {
    sourceModel: TestModel,
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
    basePipeline: (userScoping: Record<string, unknown>): Array<PipelineStage> => {
      const pipeline: Array<PipelineStage> = [
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
    sourceModel: TestResultModel,
    allowedFields: [
      "studentName",
      "testName",
      "totalMarksObtained",
      "percentage",
      "completedAt",
      "subjectBreakdown"
    ],
    defaultSort: { completedAt: -1 },
    basePipeline: (userScoping: Record<string, unknown>): Array<PipelineStage> => {
      const pipeline: Array<PipelineStage> = [
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
    sourceModel: QuestionModel,
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
    basePipeline: (_userScoping: Record<string, unknown>): Array<PipelineStage> => {
      const pipeline: Array<PipelineStage> = [
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
    sourceModel: UserResponseModel,
    allowedFields: [
      "studentName",
      "status",
      "timeSpent",
      "isCorrect",
      "marksObtained",
      "testQuestionId"
    ],
    defaultSort: { updatedAt: -1 },
    basePipeline: (userScoping: Record<string, unknown>): Array<PipelineStage> => {
      const pipeline: Array<PipelineStage> = [
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
    sourceModel: TestResultModel,
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
    basePipeline: (userScoping: Record<string, unknown>): Array<PipelineStage> => {
      const pipeline: Array<PipelineStage> = [
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

export const executeFlatViewQuery = async (
  viewName: string,
  userScoping: Record<string, unknown>,
  selectFields?: Array<string>,
  orderBy?: string,
  limitNum: number = 20,
  skipNum: number = 0
): Promise<{ success: boolean; data: Array<Record<string, unknown>>; count: number }> => {
  const config: IViewConfig | undefined = VIEW_REGISTRY[viewName];
  if (!config) {
    throw new Error(`View '${viewName}' is not registered.`);
  }

  // 1. Build Base Pipeline with Match-First Principle (Rule VIEW-004)
  const pipeline: Array<PipelineStage> = config.basePipeline(userScoping);

  // 2. Validate Whitelist for Projections (Rule VIEW-002)
  if (selectFields && selectFields.length > 0) {
    const projectStage: Record<string, 1> = { _id: 1 };
    for (const field of selectFields) {
      if (!config.allowedFields.includes(field)) {
        throw new Error(
          `Field '${field}' is not queryable on view '${viewName}'. Allowed: ${config.allowedFields.join(", ")}`
        );
      }
      projectStage[field] = 1;
    }
    pipeline.push({ $project: projectStage });
  }

  // 3. Sorting
  if (orderBy && orderBy.length > 0) {
    const [field, direction] = orderBy.split(":");
    if (field && config.allowedFields.includes(field)) {
      const sortDir: 1 | -1 = direction?.toLowerCase() === "asc" ? 1 : -1;
      pipeline.push({ $sort: { [field]: sortDir } });
    }
  } else {
    pipeline.push({ $sort: config.defaultSort });
  }

  // 4. Pagination (Max 100 per Rule DDOS-004 / VIEW-001)
  const finalLimit: number = Math.min(Math.max(1, limitNum), 100);
  pipeline.push({ $skip: Math.max(0, skipNum) });
  pipeline.push({ $limit: finalLimit });

  const data = await config.sourceModel.aggregate(pipeline);
  return { success: true, data, count: data.length };
};
