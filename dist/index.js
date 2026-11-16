"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_session_1 = __importDefault(require("express-session"));
const init_1 = require("./database/init");
const auth_1 = require("./middlewares/auth");
const rbacGuard_1 = require("./middlewares/rbacGuard");
const ddosGate_1 = require("./middlewares/ddosGate");
const entities_1 = require("./entities");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT ? Number(process.env.PORT) : 5001;
// 1. Trust Proxy Configuration for Accurate IP Resolution (Rule DDOS-006)
app.set("trust proxy", 1);
// 2. CORS configuration (Rule BND-002)
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true
}));
// 3. Payload & Buffer Overflow Bounds (Rule DDOS-002)
app.use(express_1.default.json({ limit: "50kb" }));
app.use(express_1.default.urlencoded({ limit: "50kb", extended: true }));
// 4. Perimeter DDoS & Rate Limiting Gate (Rule DDOS-001)
app.use(ddosGate_1.ddosGate);
// 5. Session State Management
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "cbtmcq_default_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
// 6. Global Auth Middleware & Single-Login Verification (Rule LIVE-008)
app.use(auth_1.authMiddleware);
// 7. Single Centralized Declarative RBAC Middleware Guard (Rule RBAC-001 - RBAC-003)
app.use(rbacGuard_1.rbacGuard);
// 8. Health check / System Ping
app.get("/api/hello", (_req, res) => {
    res.status(200).json({ success: true, message: "Hello from backend!" });
});
// 9. Register Entity Routes
(0, entities_1.registerEntities)(app);
// 10. Global 404 Handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found.",
        error: "NOT_FOUND"
    });
});
// 11. Connect Database & Start Server with Slowloris Timeout Guards (Rule DDOS-003)
(0, init_1.initMongoose)()
    .then(() => {
    console.log("Database connected successfully.");
    const server = app.listen(port, () => {
        console.log(`CBTMCQ API Server running at http://localhost:${port}`);
    });
    // Slowloris & Socket Starvation Prevention
    server.headersTimeout = 10000; // 10 seconds to receive headers
    server.requestTimeout = 20000; // 20 seconds total request execution
    server.keepAliveTimeout = 5000; // 5 seconds keep-alive idle cap
})
    .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
});
exports.default = app;
