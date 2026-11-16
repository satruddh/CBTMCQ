import { Application } from "express";
import userRoutes from "./users/routes";
import othersRoutes from "./others/routes";
import subjectsRoutes from "./subjects/routes";
import questionsRoutes from "./questions/routes";
import testsRoutes from "./tests/routes";
import userResponseRoutes from "./userResponse/routes";
import viewsRoutes from "./views/routes";

export const registerEntities = (app: Application): void => {
  app.use("/users", userRoutes);
  app.use("/sessions", othersRoutes);
  app.use("/subjects", subjectsRoutes);
  app.use("/questions", questionsRoutes);
  app.use("/tests", testsRoutes);
  app.use("/userResponse", userResponseRoutes);
  app.use("/views", viewsRoutes);
};

export default registerEntities;
