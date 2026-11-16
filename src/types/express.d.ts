import "express-session";

export interface IAuthUser {
  _id: string;
  username: string;
  name: string;
  email: string;
  role: "ADMIN" | "FACULTY" | "STUDENT";
  academicYear: number;
}

declare module "express-session" {
  interface SessionData {
    isAuthenticated?: boolean;
    authenticatedUser?: {
      user: IAuthUser;
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}
