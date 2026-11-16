import { Router, Request, Response } from "express";
import { loginPostHandler, loginGetHandler } from "../controllers/loginController";
import { signupPostHandler } from "../controllers/signupController";
import { logoutHandler } from "../controllers/logoutController";

const router: Router = Router();

router.post("/login", loginPostHandler);
router.get("/login", loginGetHandler);

router.post("/signup", signupPostHandler);
router.get("/signup", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Signup service active." });
});

router.get("/logout", logoutHandler);
router.post("/logout", logoutHandler);

export default router;
