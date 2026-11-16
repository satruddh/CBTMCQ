import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

interface IRouteRule {
  path: string;
  methods: Array<string>;
}

interface IRolePermission {
  inherits?: Array<string>;
  allow: Array<IRouteRule>;
}

interface IRbacPolicy {
  version: string;
  default_policy: string;
  roles: Array<string>;
  public_routes: Array<IRouteRule>;
  permissions: Record<string, IRolePermission>;
}

let cachedPolicy: IRbacPolicy | null = null;

const loadRbacPolicy = (): IRbacPolicy => {
  if (cachedPolicy !== null) {
    return cachedPolicy;
  }
  const policyPath: string = path.resolve(process.cwd(), "config/rbac-policy.yaml");
  const fileContents: string = fs.readFileSync(policyPath, "utf8");
  cachedPolicy = yaml.load(fileContents) as IRbacPolicy;
  return cachedPolicy;
};

const checkRouteMatch = (rules: Array<IRouteRule>, reqPath: string, method: string): boolean => {
  for (const rule of rules) {
    const regex: RegExp = new RegExp(rule.path);
    if (regex.test(reqPath) && rule.methods.includes(method.toUpperCase())) {
      return true;
    }
  }
  return false;
};

const evaluateRoleAccess = (
  policy: IRbacPolicy,
  role: string,
  reqPath: string,
  method: string,
  visitedRoles: Set<string> = new Set<string>()
): boolean => {
  if (visitedRoles.has(role)) {
    return false; // Prevent circular inheritance
  }
  visitedRoles.add(role);

  const rolePerm: IRolePermission | undefined = policy.permissions[role];
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

export const rbacGuard = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const policy: IRbacPolicy = loadRbacPolicy();
    const reqPath: string = req.path;
    const reqMethod: string = req.method;

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
    const hasAccess: boolean = evaluateRoleAccess(policy, req.user.role, reqPath, reqMethod);

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
  } catch (error) {
    console.error("RBAC guard exception:", error);
    res.status(500).json({
      success: false,
      message: "Security authorization error occurred.",
      error: "RBAC_EVALUATION_ERROR"
    });
  }
};
