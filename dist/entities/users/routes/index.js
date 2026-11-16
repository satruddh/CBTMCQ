"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loginController_1 = require("../controllers/loginController");
const signupController_1 = require("../controllers/signupController");
const logoutController_1 = require("../controllers/logoutController");
const router = (0, express_1.Router)();
router.post("/login", loginController_1.loginPostHandler);
router.get("/login", loginController_1.loginGetHandler);
router.post("/signup", signupController_1.signupPostHandler);
router.get("/signup", (_req, res) => {
    res.status(200).json({ success: true, message: "Signup service active." });
});
router.get("/logout", logoutController_1.logoutHandler);
router.post("/logout", logoutController_1.logoutHandler);
exports.default = router;
