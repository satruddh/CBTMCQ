"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const liveTestController_1 = require("../../tests/controllers/liveTestController");
const router = (0, express_1.Router)();
router.post("/", liveTestController_1.saveUserResponseHandler);
router.put("/", liveTestController_1.saveUserResponseHandler);
exports.default = router;
