import { Request, Response } from "express";
import { getSubjects, IGetSubjectsResult } from "../services/getSubjects";

export const getSubjectsHandlerPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId: string = req.body.userID ? String(req.body.userID) : req.user ? req.user._id : "";
    const academicYear: number | undefined = req.body.academicYear
      ? Number(req.body.academicYear)
      : undefined;

    const result: IGetSubjectsResult = await getSubjects(
      userId.length > 0 ? userId : undefined,
      academicYear
    );

    res.status(200).json({
      success: true,
      message: result.message,
      subjects: result.subjects
    });
  } catch (error) {
    console.error("Error retrieving subjects:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error retrieving subjects.",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};
