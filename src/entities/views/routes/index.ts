import { Router } from "express";
import { getViewHandler } from "../controllers/viewController";

const router: Router = Router();

router.get("/:viewName", getViewHandler);

export default router;
