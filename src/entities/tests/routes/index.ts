import { Router } from "express";
import {
  createTestHandler,
  getTestsHandler,
  getAvailableTestsHandler,
  enrollStudentHandler,
  bulkEnrollStudentsHandler,
  startTestSessionHandler,
  syncSessionHandler,
  saveProgressHandler,
  saveUserResponseHandler,
  submitTestHandler,
  getTestReviewHandler
} from "../controllers/liveTestController";

const router: Router = Router();

// Test Management & Discovery
router.post("/", createTestHandler);
router.get("/", getTestsHandler);
router.get("/available", getAvailableTestsHandler);

// Student Enrollment & Bulk Enrollment
router.post("/:id/enroll", enrollStudentHandler);
router.post("/:id/enroll-students", bulkEnrollStudentsHandler);

// Live Test Session Lifecycle
router.post("/:id/start", startTestSessionHandler);
router.get("/:id/session/sync", syncSessionHandler);
router.post("/:id/session/save-progress", saveProgressHandler);
router.post("/:id/session/answer", saveUserResponseHandler);
router.post("/:id/submit", submitTestHandler);
router.get("/:id/session/review", getTestReviewHandler);

export default router;
