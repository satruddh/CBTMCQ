import { Request, Response } from "express";
import {
  createTestService,
  getTestsService,
  getAvailableTestsForStudent,
  enrollStudentService,
  bulkEnrollStudentsService,
  startOrResumeSession,
  saveProgressService,
  saveAnswerResponse,
  submitAndGradeTest,
  getTestReviewService,
  IStartSessionResult,
  ITestReviewResult
} from "../services/liveTestService";
import TestSessionModel from "../../../database/models/TestSession";

export const createTestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      testName,
      description,
      academicYear,
      subjects,
      testType,
      totalMarks,
      duration,
      passingScore,
      startTime,
      endTime,
      isActive,
      isPublished
    } = req.body;

    if (
      !testName ||
      academicYear === undefined ||
      academicYear === null ||
      !subjects ||
      !testType ||
      totalMarks === undefined ||
      totalMarks === null ||
      duration === undefined ||
      duration === null ||
      !startTime
    ) {
      res.status(400).json({
        success: false,
        message: "Missing required fields for test creation.",
        error: "MISSING_REQUIRED_FIELDS"
      });
      return;
    }

    const createdBy: string = req.body.createdBy || (req.user ? req.user._id : "");
    if (!createdBy) {
      res.status(400).json({
        success: false,
        message: "createdBy author ID is required.",
        error: "MISSING_CREATED_BY"
      });
      return;
    }

    const newTest = await createTestService({
      testName: String(testName),
      description: description ? String(description) : "",
      academicYear: Number(academicYear),
      subjects: Array.isArray(subjects) ? subjects.map(String) : new Array<string>(),
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
  } catch (error) {
    console.error("Error in createTestHandler:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error creating test.",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

export const getTestsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
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

    const tests = await getTestsService(filter);
    res.status(200).json({
      success: true,
      data: tests
    });
  } catch (error) {
    console.error("Error in getTestsHandler:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error fetching tests.",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

export const getAvailableTestsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId: string = req.user ? req.user._id : "";
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required to view available tests.",
        error: "UNAUTHORIZED"
      });
      return;
    }

    const academicYear: number =
      req.user && req.user.academicYear ? Number(req.user.academicYear) : 1;
    const availableTests = await getAvailableTestsForStudent(userId, academicYear);

    res.status(200).json({
      success: true,
      data: availableTests
    });
  } catch (error) {
    console.error("Error in getAvailableTestsHandler:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error fetching available tests.",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

export const enrollStudentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const testId: string = req.params.id ? String(req.params.id) : "";
    const userId: string = req.user ? req.user._id : "";

    if (!testId || !userId) {
      res.status(400).json({
        success: false,
        message: "Test ID and student authentication are required.",
        error: "MISSING_REQUIRED_PARAMS"
      });
      return;
    }

    const result = await enrollStudentService(testId, userId);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.session
    });
  } catch (error: unknown) {
    console.error("Error in enrollStudentHandler:", error);
    const errorMessage: string =
      error instanceof Error ? error.message : "Failed to enroll in test.";
    res.status(400).json({
      success: false,
      message: errorMessage,
      error: "ENROLLMENT_FAILED"
    });
  }
};

export const bulkEnrollStudentsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const testId: string = req.params.id ? String(req.params.id) : "";
    const studentIds: Array<string> = Array.isArray(req.body.studentIds)
      ? req.body.studentIds.map(String)
      : new Array<string>();

    if (!testId || studentIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "Test ID and non-empty studentIds array are required.",
        error: "MISSING_REQUIRED_PARAMS"
      });
      return;
    }

    const result = await bulkEnrollStudentsService(testId, studentIds);
    res.status(200).json({
      success: true,
      message: `Enrolled ${result.enrolledCount} students successfully.`,
      data: { enrolledCount: result.enrolledCount }
    });
  } catch (error: unknown) {
    console.error("Error in bulkEnrollStudentsHandler:", error);
    const errorMessage: string =
      error instanceof Error ? error.message : "Failed to bulk enroll students.";
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

export const startTestSessionHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const testId: string = req.params.id ? String(req.params.id) : "";
    const userId: string = req.user ? req.user._id : "";
    const sessionId: string = req.sessionID || "";
    const clientIp: string = req.ip || req.socket.remoteAddress || "";

    if (!testId || !userId) {
      res.status(400).json({
        success: false,
        message: "Test ID and valid user authentication are required.",
        error: "MISSING_REQUIRED_PARAMS"
      });
      return;
    }

    const result: IStartSessionResult = await startOrResumeSession(
      testId,
      userId,
      sessionId,
      clientIp
    );

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
  } catch (error) {
    console.error("Error in startTestSessionHandler:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error starting test session.",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

export const syncSessionHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const testId: string = req.params.id ? String(req.params.id) : "";
    const userId: string = req.user ? req.user._id : "";

    const session = await TestSessionModel.findOne({ userId, testId });
    if (!session) {
      res.status(404).json({
        success: false,
        message: "Active session not found.",
        error: "SESSION_NOT_FOUND"
      });
      return;
    }

    const remainingSeconds: number = session.expiresAt
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
  } catch (error) {
    console.error("Error in syncSessionHandler:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error syncing session.",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

export const saveProgressHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const testId: string = req.params.id ? String(req.params.id) : "";
    const userId: string = req.user ? req.user._id : "";
    const { currentQuestionIndex, paletteState } = req.body;

    if (currentQuestionIndex === undefined || currentQuestionIndex === null) {
      res.status(400).json({
        success: false,
        message: "currentQuestionIndex is required.",
        error: "MISSING_INDEX"
      });
      return;
    }

    const result = await saveProgressService(
      testId,
      userId,
      Number(currentQuestionIndex),
      paletteState
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: { lastSavedAt: result.lastSavedAt }
    });
  } catch (error) {
    console.error("Error in saveProgressHandler:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save test progress.",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

export const saveUserResponseHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId: string = req.user ? req.user._id : "";
    const { testQuestionId, selectedOptionIds, status, timeSpent } = req.body;

    if (!testQuestionId) {
      res.status(400).json({
        success: false,
        message: "testQuestionId is required.",
        error: "MISSING_QUESTION_ID"
      });
      return;
    }

    const savedDoc = await saveAnswerResponse(
      userId,
      String(testQuestionId),
      Array.isArray(selectedOptionIds) ? selectedOptionIds : new Array<string>(),
      status ? status : "ATTEMPTED",
      timeSpent ? Number(timeSpent) : 0
    );

    res.status(200).json({
      success: true,
      message: "Answer response recorded.",
      data: savedDoc
    });
  } catch (error) {
    console.error("Error in saveUserResponseHandler:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record response.",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

export const submitTestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const testId: string = req.params.id ? String(req.params.id) : "";
    const userId: string = req.user ? req.user._id : "";

    if (!testId || !userId) {
      res.status(400).json({
        success: false,
        message: "Test ID is required.",
        error: "MISSING_TEST_ID"
      });
      return;
    }

    const result = await submitAndGradeTest(testId, userId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        status: "SUBMITTED",
        resultWithheldUntil: result.resultWithheldUntil
      }
    });
  } catch (error) {
    console.error("Error in submitTestHandler:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit and grade test.",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};

export const getTestReviewHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const testId: string = req.params.id ? String(req.params.id) : "";
    const userId: string = req.user ? req.user._id : "";

    if (!testId || !userId) {
      res.status(400).json({
        success: false,
        message: "Test ID and student authentication are required.",
        error: "MISSING_REQUIRED_PARAMS"
      });
      return;
    }

    const result: ITestReviewResult = await getTestReviewService(testId, userId);

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
  } catch (error) {
    console.error("Error in getTestReviewHandler:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error retrieving test review.",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};
