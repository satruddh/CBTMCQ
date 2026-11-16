import SubjectModel, { ISubject } from "../../../database/models/Subject";

export interface IGetSubjectsResult {
  success: boolean;
  message: string;
  subjects: Array<ISubject>;
}

export const getSubjects = async (
  userId?: string,
  academicYear?: number
): Promise<IGetSubjectsResult> => {
  try {
    const filter: Record<string, unknown> = { isActive: true };
    if (userId) {
      filter.createdBy = userId;
    }
    if (academicYear) {
      filter.academicYear = academicYear;
    }

    // Limit capped at 100 per DDOS Rule DDOS-004
    const subjects: Array<ISubject> = await SubjectModel.find(filter)
      .populate("createdBy", "username email role academicYear")
      .limit(100);

    return {
      success: true,
      message: "Subjects fetched successfully.",
      subjects
    };
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return {
      success: false,
      message: "Failed to fetch subjects.",
      subjects: new Array<ISubject>()
    };
  }
};
