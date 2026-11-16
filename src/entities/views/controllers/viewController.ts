import { Request, Response } from "express";
import { Types } from "mongoose";
import { executeFlatViewQuery } from "../services/viewService";

export const getViewHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const viewName: string = req.params.viewName ? String(req.params.viewName).trim() : "";
    const selectStr: string = req.query.select ? String(req.query.select) : "";
    const orderBy: string = req.query.orderBy ? String(req.query.orderBy) : "";
    const limit: number = req.query.limit ? Number(req.query.limit) : 20;
    const page: number = req.query.page ? Number(req.query.page) : 1;
    const skip: number = (page - 1) * limit;

    const selectFields: Array<string> = selectStr
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Tenant / Student Scoping: students only see their own personal results, except for public/test leaderboards
    const userScoping: Record<string, unknown> = {};
    if (viewName !== "test-leaderboard" && req.user && req.user.role === "STUDENT") {
      userScoping.userId = req.user._id;
    }

    if (req.query.testId && Types.ObjectId.isValid(String(req.query.testId))) {
      userScoping.testId = new Types.ObjectId(String(req.query.testId));
    }

    const result = await executeFlatViewQuery(
      viewName,
      userScoping,
      selectFields.length > 0 ? selectFields : undefined,
      orderBy,
      limit,
      skip
    );

    res.status(200).json({
      success: true,
      view: viewName,
      count: result.count,
      data: result.data
    });
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : "Error querying view";
    res.status(400).json({
      success: false,
      message: errorMessage,
      error: "VIEW_QUERY_ERROR"
    });
  }
};
