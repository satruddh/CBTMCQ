"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const viewController_1 = require("../controllers/viewController");
const router = (0, express_1.Router)();
router.get("/:viewName", viewController_1.getViewHandler);
exports.default = router;
