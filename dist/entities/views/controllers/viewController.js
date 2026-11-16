"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getViewHandler = void 0;
const mongoose_1 = require("mongoose");
const viewService_1 = require("../services/viewService");
const getViewHandler = async (req, res) => {
    try {
        const viewName = req.params.viewName ? String(req.params.viewName).trim() : "";
        const selectStr = req.query.select ? String(req.query.select) : "";
        const orderBy = req.query.orderBy ? String(req.query.orderBy) : "";
        const limit = req.query.limit ? Number(req.query.limit) : 20;
        const page = req.query.page ? Number(req.query.page) : 1;
        const skip = (page - 1) * limit;
        const selectFields = selectStr
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        // Tenant / Student Scoping: students only see their own personal results, except for public/test leaderboards
        const userScoping = {};
        if (viewName !== "test-leaderboard" && req.user && req.user.role === "STUDENT") {
            userScoping.userId = req.user._id;
        }
        if (req.query.testId && mongoose_1.Types.ObjectId.isValid(String(req.query.testId))) {
            userScoping.testId = new mongoose_1.Types.ObjectId(String(req.query.testId));
        }
        const result = await (0, viewService_1.executeFlatViewQuery)(viewName, userScoping, selectFields.length > 0 ? selectFields : undefined, orderBy, limit, skip);
        res.status(200).json({
            success: true,
            view: viewName,
            count: result.count,
            data: result.data
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error querying view";
        res.status(400).json({
            success: false,
            message: errorMessage,
            error: "VIEW_QUERY_ERROR"
        });
    }
};
exports.getViewHandler = getViewHandler;
