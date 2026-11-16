import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import http from "http";

import { initMongoose } from "./database/init";
import { authMiddleware } from "./middlewares/auth";
import { rbacGuard } from "./middlewares/rbacGuard";
import { ddosGate } from "./middlewares/ddosGate";
import { registerEntities } from "./entities";

dotenv.config();

const app: Application = express();
const port: number = process.env.PORT ? Number(process.env.PORT) : 5001;

// 1. Trust Proxy Configuration for Accurate IP Resolution (Rule DDOS-006)
app.set("trust proxy", 1);

// 2. CORS configuration (Rule BND-002)
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true
  })
);

// 3. Payload & Buffer Overflow Bounds (Rule DDOS-002)
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ limit: "50kb", extended: true }));

// 4. Perimeter DDoS & Rate Limiting Gate (Rule DDOS-001)
app.use(ddosGate);

// 5. Session State Management
app.use(
  session({
    secret: process.env.SESSION_SECRET || "cbtmcq_default_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// 6. Global Auth Middleware & Single-Login Verification (Rule LIVE-008)
app.use(authMiddleware);

// 7. Single Centralized Declarative RBAC Middleware Guard (Rule RBAC-001 - RBAC-003)
app.use(rbacGuard);

// 8. Health check / System Ping
app.get("/api/hello", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Hello from backend!" });
});

// 9. Register Entity Routes
registerEntities(app);

// 10. Global 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found.",
    error: "NOT_FOUND"
  });
});

// 11. Connect Database & Start Server with Slowloris Timeout Guards (Rule DDOS-003)
initMongoose()
  .then(() => {
    console.log("Database connected successfully.");
    const server: http.Server = app.listen(port, () => {
      console.log(`CBTMCQ API Server running at http://localhost:${port}`);
    });

    // Slowloris & Socket Starvation Prevention
    server.headersTimeout = 10000; // 10 seconds to receive headers
    server.requestTimeout = 20000; // 20 seconds total request execution
    server.keepAliveTimeout = 5000; // 5 seconds keep-alive idle cap
  })
  .catch((err: Error) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });

export default app;
