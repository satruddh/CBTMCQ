import { Router } from "express";
import { sessionGetHandler } from "../controllers/sessionController";

const router: Router = Router();

router.get("/", sessionGetHandler);

export default router;
