import { Router } from "express";
import { saveUserResponseHandler } from "../../tests/controllers/liveTestController";

const router: Router = Router();

router.post("/", saveUserResponseHandler);
router.put("/", saveUserResponseHandler);

export default router;
