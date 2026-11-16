import { Types } from "mongoose";
import TestModel, { ITest } from "../../../database/models/Test";
import TestQuestionModel, { ITestQuestion } from "../../../database/models/TestQuestion";
import QuestionModel, { IQuestion, IOption } from "../../../database/models/Question";
import TestSessionModel, {
  ITestSession,
  IShuffledQuestion
} from "../../../database/models/TestSession";
import UserResponseModel, { IUserResponse } from "../../../database/models/UserResponse";
import TestResultModel, {
  ITestResult,
  ISubjectBreakdown
} from "../../../database/models/TestResult";

export interface IClientOption {
  _id: string;
  text: string;
}

export interface IReviewOption {
  _id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
  isSelected: boolean;
}

export interface IReviewQuestion {
  testQuestionId: string;
  questionId: string;
  sequenceNumber: number;
  questionText: string;
  questionType: string;
  questionExplanation: string;
  assignedMarks: number;
  studentStatus: string;
  timeSpent: number;
  studentSelectedOptionIds: Array<string>;
  options: Array<IReviewOption>;
}

export interface ITestReviewData {
  testId: string;
  testName: string;
  testType: string;
  totalMarks: number;
  passingScore: number;
  totalMarksObtained: number;
  percentage: number;
  passed: boolean;
  totalQuestions: number;
  completedAt: Date | null;
  subjectWiseBreakdown: Array<ISubjectBreakdown>;
  questions: Array<IReviewQuestion>;
}

export interface ITestReviewResult {
  success: boolean;
  message: string;
  data?: ITestReviewData;
  error?: string;
  resultWithheldUntil?: Date | null;
}

export interface IClientQuestion {
  testQuestionId: string;
  questionId: string;
  sequenceNumber: number;
  questionText: string;
  questionType: string;
  assignedMarks: number;
  options: Array<IClientOption>;
}

export interface IStartSessionResult {
  success: boolean;
  message: string;
  sessionId: string;
  startedAt: Date | null;
  expiresAt: Date | null;
  remainingSeconds: number;
  currentQuestionIndex: number;
  paletteState: Record<string, string>;
  questions: Array<IClientQuestion>;
  error: string;
}

export interface ICreateTestPayload {
  testName: string;
  description?: string;
  academicYear: number;
  subjects: Array<string>;
  testType: "MIDTERM" | "ENDTERM" | "QUIZ" | "ASSIGNMENT" | "MOCK";
  totalMarks: number;
  duration: number;
  passingScore?: number;
  startTime: string | Date;
  endTime?: string | Date;
  isActive?: boolean;
  isPublished?: boolean;
  createdBy: string;
}

// Fisher-Yates in-place shuffle helper
const shuffleArray = <T>(array: Array<T>): Array<T> => {
  const result: Array<T> = [...array];
  for (let i: number = result.length - 1; i > 0; i--) {
    const j: number = Math.floor(Math.random() * (i + 1));
    const temp: T = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
};

// 1. Create Test (Powers cbtmcq-ui AddTest.jsx)
export const createTestService = async (payload: ICreateTestPayload): Promise<ITest> => {
  const startTimeDate: Date = new Date(payload.startTime);
  let endTimeDate: Date;

  if (payload.endTime && String(payload.endTime).trim().length > 0) {
    endTimeDate = new Date(payload.endTime);
  } else {
    // If endTime omitted, default window to startTime + duration
    endTimeDate = new Date(startTimeDate.getTime() + payload.duration * 60 * 1000);
  }

  const subjectObjectIds: Array<Types.ObjectId> = payload.subjects.map(
    (id: string) => new Types.ObjectId(id)
  );

  const newTest: ITest = new TestModel({
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
    createdBy: new Types.ObjectId(payload.createdBy)
  });

  await newTest.save();
  return newTest;
};

// 2. Get Tests (Admin / Faculty listing)
export const getTestsService = async (
  filter: Record<string, unknown> = {}
): Promise<Array<ITest>> => {
  const tests: Array<ITest> = await TestModel.find(filter)
    .populate("subjects", "subjectCode subjectName")
    .populate("createdBy", "name username email")
    .sort({ "schedule.startTime": -1 })
    .limit(100);
  return tests;
};

// 3. Get Published Tests Available for Student Enrollment
export const getAvailableTestsForStudent = async (
  userIdStr: string,
  academicYear: number
): Promise<Array<Record<string, unknown>>> => {
  const userId: Types.ObjectId = new Types.ObjectId(userIdStr);

  const tests: Array<ITest> = await TestModel.find({
    academicYear,
    isActive: true,
    isPublished: true
  })
    .populate("subjects", "subjectCode subjectName")
    .populate("createdBy", "name")
    .sort({ "schedule.startTime": 1 })
    .limit(100);

  const testIds: Array<Types.ObjectId> = tests.map((t) => t._id as Types.ObjectId);
  const enrolledSessions = await TestSessionModel.find({
    userId,
    testId: { $in: testIds }
  });

  const enrolledMap: Map<string, string> = new Map<string, string>();
  enrolledSessions.forEach((s) => enrolledMap.set(String(s.testId), s.status));

  const result: Array<Record<string, unknown>> = tests.map((test) => {
    const status: string | undefined = enrolledMap.get(String(test._id));
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

// 4. Student Self-Enrollment
export const enrollStudentService = async (
  testIdStr: string,
  userIdStr: string
): Promise<{ success: boolean; message: string; session: ITestSession }> => {
  const testId: Types.ObjectId = new Types.ObjectId(testIdStr);
  const userId: Types.ObjectId = new Types.ObjectId(userIdStr);

  const test: ITest | null = await TestModel.findById(testId);
  if (!test || !test.isActive) {
    throw new Error("Test not found or inactive.");
  }

  let session: ITestSession | null = await TestSessionModel.findOne({ userId, testId });
  if (session) {
    return { success: true, message: "Already enrolled in this test.", session };
  }

  // Pre-create session in SCHEDULED status
  session = new TestSessionModel({
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

// 5. Admin Bulk Student Enrollment
export const bulkEnrollStudentsService = async (
  testIdStr: string,
  studentIds: Array<string>
): Promise<{ success: boolean; enrolledCount: number }> => {
  const testId: Types.ObjectId = new Types.ObjectId(testIdStr);
  let enrolledCount: number = 0;

  for (const idStr of studentIds) {
    const userId: Types.ObjectId = new Types.ObjectId(idStr);
    const existing = await TestSessionModel.findOne({ userId, testId });
    if (!existing) {
      await new TestSessionModel({
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

// Helper: Build Fisher-Yates Shuffled Sequence with both testQuestionId and questionId
const buildShuffledQuestions = async (
  testId: Types.ObjectId
): Promise<Array<IShuffledQuestion>> => {
  const testQuestions: Array<ITestQuestion> = await TestQuestionModel.find({ testId }).sort({
    sequenceNumber: 1
  });

  const questionIds: Array<Types.ObjectId> = testQuestions.map((tq) => tq.questionId);
  const rawQuestions: Array<IQuestion> = await QuestionModel.find({ _id: { $in: questionIds } });

  const questionMap: Map<string, IQuestion> = new Map<string, IQuestion>();
  rawQuestions.forEach((q) => questionMap.set(String(q._id), q));

  const shuffledIndices: Array<ITestQuestion> = shuffleArray(testQuestions);
  const shuffledSequence: Array<IShuffledQuestion> = new Array<IShuffledQuestion>();

  for (let i: number = 0; i < shuffledIndices.length; i++) {
    const tq: ITestQuestion = shuffledIndices[i]!;
    const q: IQuestion | undefined = questionMap.get(String(tq.questionId));
    const optionIds: Array<Types.ObjectId> = q
      ? shuffleArray(q.options.map((opt: IOption) => opt._id))
      : new Array<Types.ObjectId>();

    shuffledSequence.push({
      testQuestionId: tq._id as Types.ObjectId,
      questionId: tq.questionId,
      sequenceNumber: i + 1,
      optionOrder: optionIds
    });
  }

  return shuffledSequence;
};

// 6. Live Test Start or Resume
export const startOrResumeSession = async (
  testIdStr: string,
  userIdStr: string,
  sessionId: string,
  clientIp: string = ""
): Promise<IStartSessionResult> => {
  try {
    const testId: Types.ObjectId = new Types.ObjectId(testIdStr);
    const userId: Types.ObjectId = new Types.ObjectId(userIdStr);

    const test: ITest | null = await TestModel.findById(testId);
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
        questions: new Array<IClientQuestion>(),
        error: "TEST_NOT_FOUND"
      };
    }

    const now: Date = new Date();
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
        questions: new Array<IClientQuestion>(),
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
        questions: new Array<IClientQuestion>(),
        error: "TEST_WINDOW_EXPIRED"
      };
    }

    const durationMs: number = test.duration * 60 * 1000;
    const scheduledEndMs: number = new Date(test.schedule.endTime).getTime();
    const calculatedEndMs: number = now.getTime() + durationMs;
    const expiresAt: Date = new Date(Math.min(calculatedEndMs, scheduledEndMs));

    let session: ITestSession | null = await TestSessionModel.findOne({ userId, testId });

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
          questions: new Array<IClientQuestion>(),
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
      } else {
        // Already IN_PROGRESS: re-bind device session ID
        session.associatedSessionId = sessionId;
        session.clientIp = clientIp;
      }

      session.lastHeartbeatAt = new Date();
      await session.save();
    } else {
      // Direct start (open enrollment)
      const shuffledSequence: Array<IShuffledQuestion> = await buildShuffledQuestions(testId);

      session = new TestSessionModel({
        userId,
        testId,
        status: "IN_PROGRESS",
        enrolledAt: now,
        startedAt: now,
        expiresAt,
        associatedSessionId: sessionId,
        clientIp,
        currentQuestionIndex: 0,
        paletteState: new Map<string, string>(),
        shuffledQuestions: shuffledSequence
      });

      await session.save();
    }

    // Zero-Knowledge Option Projection (Rule LIVE-001)
    const remainingSeconds: number = session.expiresAt
      ? Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000))
      : 0;

    const testQuestionsMap: Map<string, ITestQuestion> = new Map<string, ITestQuestion>();
    const allTqs: Array<ITestQuestion> = await TestQuestionModel.find({ testId });
    allTqs.forEach((tq) => testQuestionsMap.set(String(tq._id), tq));

    const qIds: Array<Types.ObjectId> = session.shuffledQuestions.map((sq) => sq.questionId);
    const questionsDb: Array<IQuestion> = await QuestionModel.find({ _id: { $in: qIds } });
    const questionsLookup: Map<string, IQuestion> = new Map<string, IQuestion>();
    questionsDb.forEach((q) => questionsLookup.set(String(q._id), q));

    const clientQuestions: Array<IClientQuestion> = new Array<IClientQuestion>();

    for (const sq of session.shuffledQuestions) {
      const qDoc: IQuestion | undefined = questionsLookup.get(String(sq.questionId));
      const tqDoc: ITestQuestion | undefined = testQuestionsMap.get(String(sq.testQuestionId));
      if (!qDoc) continue;

      const optMap: Map<string, IOption> = new Map<string, IOption>();
      qDoc.options.forEach((opt: IOption) => optMap.set(String(opt._id), opt));

      const clientOptions: Array<IClientOption> = new Array<IClientOption>();
      for (const optId of sq.optionOrder) {
        const optionDoc: IOption | undefined = optMap.get(String(optId));
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
  } catch (error) {
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
      questions: new Array<IClientQuestion>(),
      error: "INTERNAL_ERROR"
    };
  }
};

export const saveProgressService = async (
  testIdStr: string,
  userIdStr: string,
  currentQuestionIndex: number,
  paletteState: Record<string, string>
): Promise<{ success: boolean; message: string; lastSavedAt: Date }> => {
  const testId: Types.ObjectId = new Types.ObjectId(testIdStr);
  const userId: Types.ObjectId = new Types.ObjectId(userIdStr);

  const session: ITestSession | null = await TestSessionModel.findOne({
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

export const saveAnswerResponse = async (
  userIdStr: string,
  testQuestionIdStr: string,
  selectedOptionIds: Array<string>,
  status: "ATTEMPTED" | "UNATTEMPTED" | "MARKED_REVIEW",
  timeSpent: number
): Promise<IUserResponse> => {
  const userId: Types.ObjectId = new Types.ObjectId(userIdStr);
  const testQuestionId: Types.ObjectId = new Types.ObjectId(testQuestionIdStr);

  const optionObjectIds: Array<Types.ObjectId> = selectedOptionIds.map(
    (id) => new Types.ObjectId(id)
  );

  const responseDoc: IUserResponse = (await UserResponseModel.findOneAndUpdate(
    { userId, testQuestionId },
    {
      selectedOptionIds: optionObjectIds,
      status,
      timeSpent: Math.max(0, timeSpent)
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )) as IUserResponse;

  return responseDoc;
};

export const submitAndGradeTest = async (
  testIdStr: string,
  userIdStr: string
): Promise<{ success: boolean; message: string; resultWithheldUntil: Date | null }> => {
  const testId: Types.ObjectId = new Types.ObjectId(testIdStr);
  const userId: Types.ObjectId = new Types.ObjectId(userIdStr);

  const test: ITest | null = await TestModel.findById(testId);
  const session: ITestSession | null = await TestSessionModel.findOne({ userId, testId });

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
  const nowMs: number = Date.now();
  const expiryMs: number = session.expiresAt
    ? new Date(session.expiresAt).getTime() + 5000
    : nowMs + 5000;

  if (nowMs > expiryMs) {
    session.status = "TIMED_OUT";
  } else {
    session.status = "SUBMITTED";
  }
  session.submittedAt = new Date();
  await session.save();

  // Server-Side Grading Engine (Rule LIVE-006)
  const testQuestions: Array<ITestQuestion> = await TestQuestionModel.find({ testId });
  const questionIds: Array<Types.ObjectId> = testQuestions.map((tq) => tq.questionId);
  const questions: Array<IQuestion> = await QuestionModel.find({ _id: { $in: questionIds } });

  const qMap: Map<string, IQuestion> = new Map<string, IQuestion>();
  questions.forEach((q) => qMap.set(String(q._id), q));

  const tqMap: Map<string, ITestQuestion> = new Map<string, ITestQuestion>();
  testQuestions.forEach((tq) => tqMap.set(String(tq._id), tq));

  const userResponses: Array<IUserResponse> = await UserResponseModel.find({
    userId,
    testQuestionId: { $in: testQuestions.map((tq) => tq._id) }
  });

  const responseMap: Map<string, IUserResponse> = new Map<string, IUserResponse>();
  userResponses.forEach((ur) => responseMap.set(String(ur.testQuestionId), ur));

  let totalMarksObtained: number = 0;
  const subjectMap: Map<
    string,
    { correct: number; incorrect: number; unanswered: number; marks: number }
  > = new Map();

  for (const tq of testQuestions) {
    const q: IQuestion | undefined = qMap.get(String(tq.questionId));
    if (!q) continue;

    const subKey: string = String(q.subjectId);
    if (!subjectMap.has(subKey)) {
      subjectMap.set(subKey, { correct: 0, incorrect: 0, unanswered: 0, marks: 0 });
    }
    const subStats = subjectMap.get(subKey)!;

    const ur: IUserResponse | undefined = responseMap.get(String(tq._id));
    const correctOptionIds: Set<string> = new Set<string>();
    q.options.forEach((opt: IOption) => {
      if (opt.isCorrect) correctOptionIds.add(String(opt._id));
    });

    if (!ur || ur.selectedOptionIds.length === 0 || ur.status === "UNATTEMPTED") {
      subStats.unanswered += 1;
      continue;
    }

    const selectedIds: Set<string> = new Set<string>(ur.selectedOptionIds.map((id) => String(id)));
    const isCorrect: boolean =
      correctOptionIds.size === selectedIds.size &&
      [...correctOptionIds].every((id) => selectedIds.has(id));

    ur.isCorrect = isCorrect;
    if (isCorrect) {
      ur.marksObtained = tq.assignedMarks;
      totalMarksObtained += tq.assignedMarks;
      subStats.correct += 1;
      subStats.marks += tq.assignedMarks;
    } else {
      ur.marksObtained = 0;
      subStats.incorrect += 1;
    }
    await ur.save();
  }

  const subjectWiseBreakdown: Array<ISubjectBreakdown> = new Array<ISubjectBreakdown>();
  for (const [subId, stats] of subjectMap.entries()) {
    subjectWiseBreakdown.push({
      subjectId: new Types.ObjectId(subId),
      correct: stats.correct,
      incorrect: stats.incorrect,
      unanswered: stats.unanswered,
      marksObtained: stats.marks
    });
  }

  const percentage: number = test.totalMarks > 0 ? (totalMarksObtained / test.totalMarks) * 100 : 0;

  await TestResultModel.findOneAndUpdate(
    { userId, testId },
    {
      userId,
      testId,
      startedAt: session.startedAt || new Date(),
      completedAt: new Date(),
      totalMarksObtained,
      percentage: Number(percentage.toFixed(2)),
      subjectWiseBreakdown
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const resultWithheldUntil: Date | null = test.testType === "MOCK" ? null : test.schedule.endTime;

  return {
    success: true,
    message: "Test submitted and graded successfully.",
    resultWithheldUntil
  };
};

// 10. Post-Exam Candidate Review with Answer Key and Explanations (Rule LIVE-010)
export const getTestReviewService = async (
  testIdStr: string,
  userIdStr: string
): Promise<ITestReviewResult> => {
  const testId: Types.ObjectId = new Types.ObjectId(testIdStr);
  const userId: Types.ObjectId = new Types.ObjectId(userIdStr);

  const session: ITestSession | null = await TestSessionModel.findOne({ userId, testId });
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

  const test: ITest | null = await TestModel.findById(testId);
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

  const result: ITestResult | null = await TestResultModel.findOne({ userId, testId });

  // Map candidate responses
  const testQuestionIds: Array<Types.ObjectId> = session.shuffledQuestions.map(
    (sq: IShuffledQuestion) => sq.testQuestionId
  );
  const responses: Array<IUserResponse> = await UserResponseModel.find({
    userId,
    testQuestionId: { $in: testQuestionIds }
  });
  const responseMap: Map<string, IUserResponse> = new Map<string, IUserResponse>();
  responses.forEach((r: IUserResponse) => responseMap.set(String(r.testQuestionId), r));

  // Map canonical questions
  const questionIds: Array<Types.ObjectId> = session.shuffledQuestions.map(
    (sq: IShuffledQuestion) => sq.questionId
  );
  const questions: Array<IQuestion> = await QuestionModel.find({ _id: { $in: questionIds } });
  const questionMap: Map<string, IQuestion> = new Map<string, IQuestion>();
  questions.forEach((q: IQuestion) => questionMap.set(String(q._id), q));

  // Map test questions for marks
  const testQuestions: Array<ITestQuestion> = await TestQuestionModel.find({
    testId,
    _id: { $in: testQuestionIds }
  });
  const tqMap: Map<string, ITestQuestion> = new Map<string, ITestQuestion>();
  testQuestions.forEach((tq: ITestQuestion) => tqMap.set(String(tq._id), tq));

  const reviewQuestions: Array<IReviewQuestion> = new Array<IReviewQuestion>();

  for (const sq of session.shuffledQuestions) {
    const q: IQuestion | undefined = questionMap.get(String(sq.questionId));
    const tq: ITestQuestion | undefined = tqMap.get(String(sq.testQuestionId));
    const resp: IUserResponse | undefined = responseMap.get(String(sq.testQuestionId));

    const selectedOptionIdStrings: Array<string> = resp
      ? resp.selectedOptionIds.map((id: Types.ObjectId) => String(id))
      : new Array<string>();

    const optMap: Map<string, IOption> = new Map<string, IOption>();
    if (q) {
      q.options.forEach((opt: IOption) => optMap.set(String(opt._id), opt));
    }

    const reviewOptions: Array<IReviewOption> = new Array<IReviewOption>();
    for (const optId of sq.optionOrder) {
      const opt: IOption | undefined = optMap.get(String(optId));
      if (opt) {
        const isSelected: boolean = selectedOptionIdStrings.includes(String(opt._id));
        reviewOptions.push({
          _id: String(opt._id),
          text: opt.text,
          isCorrect: Boolean(opt.isCorrect),
          explanation: opt.explanation || "",
          isSelected
        });
      }
    }

    const correctOption: IOption | undefined = q
      ? q.options.find((opt: IOption) => opt.isCorrect)
      : undefined;
    const questionExplanation: string = correctOption ? correctOption.explanation : "";

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

  const marksObtained: number = result ? result.totalMarksObtained : 0;
  const percentage: number = result ? result.percentage : 0;
  const passed: boolean = marksObtained >= (test.passingScore || 40);

  const reviewData: ITestReviewData = {
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
    subjectWiseBreakdown: result ? result.subjectWiseBreakdown : new Array<ISubjectBreakdown>(),
    questions: reviewQuestions
  };

  return {
    success: true,
    message: "Test review data retrieved successfully.",
    data: reviewData
  };
};
