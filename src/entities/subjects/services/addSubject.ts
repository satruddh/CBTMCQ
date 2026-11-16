import SubjectModel, { ISubject } from "../../../database/models/Subject";
import UserModel, { IUser } from "../../../database/models/User";

export interface IAddSubjectData {
  subjectCode: string;
  subjectName: string;
  description?: string;
  academicYear: number;
  credits?: number;
  createdBy: string;
}

export interface IAddSubjectResult {
  success: boolean;
  message: string;
  subject: Record<string, unknown> | null;
  error: string;
}

export const addSubject = async (data: IAddSubjectData): Promise<IAddSubjectResult> => {
  try {
    const user: IUser | null = await UserModel.findById(data.createdBy);
    if (!user) {
      return {
        success: false,
        message: "Creator user account not found.",
        subject: null,
        error: "USER_NOT_FOUND"
      };
    }

    const newSubject: ISubject = new SubjectModel({
      subjectCode: data.subjectCode.trim(),
      subjectName: data.subjectName.trim(),
      description: data.description ? data.description.trim() : "",
      academicYear: data.academicYear,
      credits: data.credits ? data.credits : 4,
      createdBy: user._id
    });

    await newSubject.save();

    return {
      success: true,
      message: "Subject added successfully.",
      subject: newSubject.toJSON(),
      error: ""
    };
  } catch (error) {
    const errMessage: string = error instanceof Error ? error.message : "Error adding subject";
    return {
      success: false,
      message: errMessage,
      subject: null,
      error: "SAVE_FAILED"
    };
  }
};
