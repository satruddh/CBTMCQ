"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const liveTestController_1 = require("../controllers/liveTestController");
const router = (0, express_1.Router)();
// Test Management & Discovery
router.post("/", liveTestController_1.createTestHandler);
router.get("/", liveTestController_1.getTestsHandler);
router.get("/available", liveTestController_1.getAvailableTestsHandler);
// Student Enrollment & Bulk Enrollment
router.post("/:id/enroll", liveTestController_1.enrollStudentHandler);
router.post("/:id/enroll-students", liveTestController_1.bulkEnrollStudentsHandler);
// Live Test Session Lifecycle
router.post("/:id/start", liveTestController_1.startTestSessionHandler);
router.get("/:id/session/sync", liveTestController_1.syncSessionHandler);
router.post("/:id/session/save-progress", liveTestController_1.saveProgressHandler);
router.post("/:id/session/answer", liveTestController_1.saveUserResponseHandler);
router.post("/:id/submit", liveTestController_1.submitTestHandler);
router.get("/:id/session/review", liveTestController_1.getTestReviewHandler);
exports.default = router;
