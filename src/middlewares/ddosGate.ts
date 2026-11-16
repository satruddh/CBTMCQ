import { Request, Response, NextFunction } from "express";

interface IRateLimitBucket {
  count: number;
  resetAt: number;
}

// In-memory buckets for sliding-window rate limiters
const globalBuckets: Map<string, IRateLimitBucket> = new Map<string, IRateLimitBucket>();
const authBuckets: Map<string, IRateLimitBucket> = new Map<string, IRateLimitBucket>();
const examBuckets: Map<string, IRateLimitBucket> = new Map<string, IRateLimitBucket>();

// Periodic cleanup of expired rate-limit records
setInterval(() => {
  const now: number = Date.now();
  for (const [key, bucket] of globalBuckets.entries()) {
    if (now >= bucket.resetAt) globalBuckets.delete(key);
  }
  for (const [key, bucket] of authBuckets.entries()) {
    if (now >= bucket.resetAt) authBuckets.delete(key);
  }
  for (const [key, bucket] of examBuckets.entries()) {
    if (now >= bucket.resetAt) examBuckets.delete(key);
  }
}, 60000);

const checkLimit = (
  store: Map<string, IRateLimitBucket>,
  key: string,
  windowMs: number,
  maxLimit: number
): { allowed: boolean; remaining: number; resetAt: number; retryAfter: number } => {
  const now: number = Date.now();
  let bucket: IRateLimitBucket | undefined = store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 1, resetAt: now + windowMs };
    store.set(key, bucket);
    return {
      allowed: true,
      remaining: maxLimit - 1,
      resetAt: bucket.resetAt,
      retryAfter: 0
    };
  }

  bucket.count += 1;
  const remaining: number = Math.max(0, maxLimit - bucket.count);
  const allowed: boolean = bucket.count <= maxLimit;
  const retryAfter: number = Math.ceil((bucket.resetAt - now) / 1000);

  return { allowed, remaining, resetAt: bucket.resetAt, retryAfter };
};

export const ddosGate = (req: Request, res: Response, next: NextFunction): void => {
  const clientIp: string = req.ip || req.socket.remoteAddress || "127.0.0.1";
  const reqPath: string = req.path;
  const reqMethod: string = req.method.toUpperCase();

  // 1. Tier 2: Auth Hardening Gate (/users/login, /users/signup)
  if ((reqPath === "/users/login" || reqPath === "/users/signup") && reqMethod === "POST") {
    const authLimit = checkLimit(authBuckets, clientIp, 900000, 10); // 10 req / 15 min
    res.setHeader("RateLimit-Limit", 10);
    res.setHeader("RateLimit-Remaining", authLimit.remaining);
    res.setHeader("RateLimit-Reset", Math.ceil(authLimit.resetAt / 1000));

    if (!authLimit.allowed) {
      res.setHeader("Retry-After", authLimit.retryAfter);
      res.status(429).json({
        success: false,
        message:
          "Too many authentication attempts from this IP. Please try again after 15 minutes.",
        error: "AUTH_RATE_LIMIT_EXCEEDED"
      });
      return;
    }
  }

  // 2. Tier 3: Exam Submission Burst Gate (/userResponse, /tests/:id/submit)
  if (reqPath.startsWith("/userResponse") || reqPath.endsWith("/submit")) {
    const sessionKey: string = req.sessionID ? `${clientIp}_${req.sessionID}` : clientIp;
    const examLimit = checkLimit(examBuckets, sessionKey, 10000, 5); // 5 req / 10s (avg 1 req / 2s)

    if (!examLimit.allowed) {
      res.setHeader("Retry-After", examLimit.retryAfter);
      res.status(429).json({
        success: false,
        message:
          "Exam submission frequency limit exceeded. Please wait a moment before sending again.",
        error: "EXAM_RATE_LIMIT_EXCEEDED"
      });
      return;
    }
  }

  // 3. Tier 1: Global Perimeter Gate (All endpoints)
  const globalLimit = checkLimit(globalBuckets, clientIp, 900000, 300); // 300 req / 15 min
  res.setHeader("X-RateLimit-Limit", 300);
  res.setHeader("X-RateLimit-Remaining", globalLimit.remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(globalLimit.resetAt / 1000));

  if (!globalLimit.allowed) {
    res.setHeader("Retry-After", globalLimit.retryAfter);
    res.status(429).json({
      success: false,
      message: "Too many requests from this IP. Please try again after 15 minutes.",
      error: "GLOBAL_RATE_LIMIT_EXCEEDED"
    });
    return;
  }

  next();
};
