import { Router } from "express";
import { addQuestionHandlerPost, getQuestionsHandler } from "../controllers/addQuestionHandler";

const router: Router = Router();

router.post("/", addQuestionHandlerPost);
router.get("/", getQuestionsHandler);
router.post("/addQuestion", addQuestionHandlerPost);

export default router;
