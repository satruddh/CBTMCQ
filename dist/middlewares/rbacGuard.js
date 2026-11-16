"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbacGuard = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
let cachedPolicy = null;
const loadRbacPolicy = () => {
    if (cachedPolicy !== null) {
        return cachedPolicy;
    }
    const policyPath = path_1.default.resolve(process.cwd(), "config/rbac-policy.yaml");
    const fileContents = fs_1.default.readFileSync(policyPath, "utf8");
    cachedPolicy = js_yaml_1.default.load(fileContents);
    return cachedPolicy;
};
const checkRouteMatch = (rules, reqPath, method) => {
    for (const rule of rules) {
        const regex = new RegExp(rule.path);
        if (regex.test(reqPath) && rule.methods.includes(method.toUpperCase())) {
            return true;
        }
    }
    return false;
};
const evaluateRoleAccess = (policy, role, reqPath, method, visitedRoles = new Set()) => {
    if (visitedRoles.has(role)) {
        return false; // Prevent circular inheritance
    }
    visitedRoles.add(role);
    const rolePerm = policy.permissions[role];
    if (!rolePerm) {
        return false;
    }
    // Check direct permissions
    if (rolePerm.allow && checkRouteMatch(rolePerm.allow, reqPath, method)) {
        return true;
    }
    // Check inherited permissions
    if (rolePerm.inherits) {
        for (const inheritedRole of rolePerm.inherits) {
            if (evaluateRoleAccess(policy, inheritedRole, reqPath, method, visitedRoles)) {
                return true;
            }
        }
    }
    return false;
};
const rbacGuard = (req, res, next) => {
    try {
        const policy = loadRbacPolicy();
        const reqPath = req.path;
        const reqMethod = req.method;
        // 1. Evaluate Public Routes
        if (checkRouteMatch(policy.public_routes, reqPath, reqMethod)) {
            next();
            return;
        }
        // 2. Authentication Check
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required to access this resource.",
                error: "UNAUTHORIZED"
            });
            return;
        }
        // 3. Admin wildcard bypass
        if (req.user.role === "ADMIN") {
            next();
            return;
        }
        // 4. Role Permission Evaluation
        const hasAccess = evaluateRoleAccess(policy, req.user.role, reqPath, reqMethod);
        if (hasAccess) {
            next();
            return;
        }
        // 5. Fail-Closed Default (Deny)
        res.status(403).json({
            success: false,
            message: `Access denied. Role '${req.user.role}' is not authorized for ${reqMethod} ${reqPath}.`,
            error: "FORBIDDEN_BY_RBAC"
        });
    }
    catch (error) {
        console.error("RBAC guard exception:", error);
        res.status(500).json({
            success: false,
            message: "Security authorization error occurred.",
            error: "RBAC_EVALUATION_ERROR"
        });
    }
};
exports.rbacGuard = rbacGuard;
