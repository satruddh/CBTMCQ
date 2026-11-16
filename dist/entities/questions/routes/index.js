"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const addQuestionHandler_1 = require("../controllers/addQuestionHandler");
const router = (0, express_1.Router)();
router.post("/", addQuestionHandler_1.addQuestionHandlerPost);
router.get("/", addQuestionHandler_1.getQuestionsHandler);
router.post("/addQuestion", addQuestionHandler_1.addQuestionHandlerPost);
exports.default = router;
