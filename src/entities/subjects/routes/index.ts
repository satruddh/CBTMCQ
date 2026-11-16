import { Router } from "express";
import { addSubjectHandlerPost } from "../controllers/addSubjectHandler";
import { getSubjectsHandlerPost } from "../controllers/getSubjectsHandler";

const router: Router = Router();

router.post("/", getSubjectsHandlerPost);
router.get("/", getSubjectsHandlerPost);
router.post("/addSubject", addSubjectHandlerPost);

export default router;
