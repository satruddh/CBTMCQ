import { Request, Response } from "express";
import { addSubject, IAddSubjectResult } from "../services/addSubject";

export const addSubjectHandlerPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const subjectName: string = req.body.subjectName ? String(req.body.subjectName).trim() : "";
    const subjectCode: string = req.body.subjectCode ? String(req.body.subjectCode).trim() : "";
    const academicYear: number = Number(req.body.academicYear);
    const createdBy: string = req.body.createdBy
      ? String(req.body.createdBy)
      : req.user
        ? req.user._id
        : "";
    const credits: number = req.body.credits ? Number(req.body.credits) : 4;
    const description: string = req.body.description ? String(req.body.description).trim() : "";

    if (!subjectCode || !subjectName || !academicYear || !createdBy) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: subjectCode, subjectName, academicYear, createdBy",
        error: "MISSING_REQUIRED_FIELDS"
      });
      return;
    }

    const result: IAddSubjectResult = await addSubject({
      subjectCode,
      subjectName,
      academicYear,
      createdBy,
      credits,
      description
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        message: result.message,
        data: result.subject
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: result.message,
      error: result.error
    });
  } catch (error) {
    console.error("Error in addSubject controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error adding subject.",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};
