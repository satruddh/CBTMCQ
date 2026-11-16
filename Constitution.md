# CBTMCQ System Constitution & Spec-Driven Development (SDD) Framework

```yaml
schema: "cbtmcq-constitution-spec/v1"
project: "CBTMCQ"
architecture: "Spec-Driven Development (SDD) & Decoupled Backend Service"
status: "Active & Binding"
last_updated: "2026-11-16"
repository: "CBTMCQ (Express / MongoDB Backend)"
companion_client: "cbtmcq-ui (React Frontend at /Users/satruddh/Documents/cbtmcq-ui)"
spec_root: "specs/openapi.yaml"
rbac_policy: "config/rbac-policy.yaml"
ddos_policy: "config/ddos-policy.yaml"
```

---

## 1. Preamble & Mission

The **CBTMCQ** platform is an enterprise-grade Computer-Based Testing (CBT) engine engineered for University Examination environments. It governs question-bank authoring, curriculum mapping, scheduled test delivery, automated grading, and real-time performance analytics.

This Constitution serves as the **Supreme Engineering & Architectural Covenant** for the `CBTMCQ` repository. In accordance with **Spec-Driven Development (SDD)**, this document, the OpenAPI specifications, and declarative policy manifests are the primary source of truth (SSOT). No implementation code may precede or deviate from these established specifications.

---

## 2. Article I: Spec-Driven Development (SDD) Framework

Every feature, route, and entity in `CBTMCQ` must be developed, tested, and verified using the Spec-Driven Development (SDD) lifecycle.

```
┌────────────────────────────────────────────────────────┐
│             SDD PHASE 1: SPECIFICATION                 │
│  - Define endpoint in specs/openapi.yaml               │
│  - Declare access control in config/rbac-policy.yaml   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            SDD PHASE 2: CONTRACT TESTING               │
│  - Auto-generate test suites from OpenAPI schema       │
│  - Execute mock tests (expected 200/201/400/401/403)   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             SDD PHASE 3: IMPLEMENTATION                │
│  - Routes (zero logic) -> Controllers -> Services      │
│  - Enforce single RBAC guard middleware                │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             SDD PHASE 4: VERIFICATION                  │
│  - Validate live responses against OpenAPI schemas     │
│  - Validate RBAC policies with negative test cases     │
└────────────────────────────────────────────────────────┘
```

### Rule SDD-001: The OpenAPI Single Source of Truth

- All API endpoints must be fully specified in `specs/openapi.yaml` prior to backend coding.
- The specification must include:
  - Exact URL path and HTTP method (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`).
  - Request parameters (path, query, header) and request body schemas with strict validation constraints.
  - Full response definitions for all possible HTTP status codes (`200`, `201`, `400`, `401`, `403`, `404`, `500`).
  - Required security scheme (`cookieAuth` or `bearerAuth`).

### Rule SDD-002: Testable Endpoint Verification

- Any newly proposed or modified API endpoint must be testable against its OpenAPI schema.
- Automated API test suites (e.g., Supertest + OpenAPI Validator / Prism) must validate that:
  1. The API refuses invalid payloads matching `400 Bad Request`.
  2. The API returns payload schemas matching the exact JSON Schema defined in `specs/openapi.yaml`.
  3. RBAC violations return `401 Unauthorized` or `403 Forbidden` according to the policy.

---

## 3. Article II: Declarative Centralized RBAC Middleware Architecture

Access control in `CBTMCQ` is decoupled from business logic and enforced at the application boundary through a **single centralized middleware handler**.

```
                       [ Incoming HTTP Request ]
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │   DDoS Defense Gate   │  --> Rate limits (Tier 1-3), payload caps,
                       │      (Perimeter)      │      Slowloris socket timeout guards
                       └───────────┬───────────┘
                                   │ Pass (within limits)
                                   ▼
                       ┌───────────────────────┐
                       │    Authentication     │  --> Validates Session / Token
                       │      Middleware       │      Sets req.user (id, role)
                       └───────────┬───────────┘
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │   Single RBAC Guard   │  --> Evaluates request against
                       │      Middleware       │      config/rbac-policy.yaml
                       └───────────┬───────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
          [ Policy Violation ]           [ Policy Matched ]
                     │                           │
                     ▼                           ▼
            HTTP 403 Forbidden                 next()
            (or 401 if unauth)                   │
                                                 ▼
                                        [ Entity Route Handler ]
```

### Rule RBAC-001: Prohibition of Scattered Role Checks

- Controllers and individual route definitions **must never** contain hardcoded role validation conditionals (e.g., `if (req.user.role !== 'ADMIN')`).
- All authorization decisions must be mediated exclusively by the global RBAC guard middleware.

### Rule RBAC-002: Declarative Policy File (`config/rbac-policy.yaml`)

Access policies are declared in `config/rbac-policy.yaml`. The schema defines roles, endpoint patterns, allowed HTTP methods, and public exclusions.

#### Canonical RBAC Policy Schema Example:

```yaml
version: "1.0"
default_policy: "DENY" # Fail-closed security architecture

roles:
  - ADMIN
  - FACULTY
  - STUDENT
  - PUBLIC

# Endpoints accessible without authentication
public_routes:
  - path: "^/users/login$"
    methods: ["POST"]
  - path: "^/users/signup$"
    methods: ["POST"]
  - path: "^/api/hello$"
    methods: ["GET"]

# Role permissions
permissions:
  STUDENT:
    allow:
      - path: "^/sessions(/.*)?$"
        methods: ["GET", "POST"]
      - path: "^/subjects$"
        methods: ["POST", "GET"]
      - path: "^/tests/[a-fA-F0-9]+/start$"
        methods: ["POST"]
      - path: "^/tests/[a-fA-F0-9]+/submit$"
        methods: ["POST"]
      - path: "^/tests/results(/.*)?$"
        methods: ["GET"]
      - path: "^/userResponse(/.*)?$"
        methods: ["GET", "POST"]

  FACULTY:
    inherits: ["STUDENT"]
    allow:
      - path: "^/subjects/addSubject$"
        methods: ["POST"]
      - path: "^/subjects/[a-fA-F0-9]+/edit$"
        methods: ["PUT", "PATCH"]
      - path: "^/questions(/.*)?$"
        methods: ["GET", "POST", "PUT", "DELETE"]
      - path: "^/tests(/.*)?$"
        methods: ["GET", "POST", "PUT", "DELETE"]
      - path: "^/testQues(/.*)?$"
        methods: ["GET", "POST", "DELETE"]

  ADMIN:
    allow:
      - path: ".*"
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
```

### Rule RBAC-003: Single Guard Middleware Contract

The centralized RBAC middleware (`middlewares/rbacGuard.js`) must strictly adhere to the following evaluation sequence:

1. **Public Route Evaluation**: Check if the requested `req.path` and `req.method` match `public_routes`. If matched, proceed immediately via `next()`.
2. **Authentication Verification**: If not public, verify `req.session.isAuthenticated` or `req.user`. If absent, immediately terminate with `401 Unauthorized`.
3. **Role & Method Resolution**: Retrieve the user's role (`ADMIN`, `FACULTY`, `STUDENT`). Check for explicit allow rules matching both the URL pattern (regex) and the HTTP method (`req.method`).
4. **Inheritance Traversal**: If the role declares `inherits`, evaluate inherited permissions recursively.
5. **Fail-Closed Default (DENY)**: If no rule explicitly grants access, immediately terminate with `403 Forbidden` and log the security audit event.

---

## 4. Article III: Repository Scope & System Boundaries

### Rule BND-001: Backend-Only Mandate

- The `CBTMCQ` repository contains only backend source code: Express application, Mongoose database models, entity controllers, services, specifications, and automated test runners.
- Frontend UI development, client assets, and React component code reside exclusively in `/Users/satruddh/Documents/cbtmcq-ui`.

### Rule BND-002: API & Network Topology

- **API Runtime Port**: Configurable via `PORT` in `.env`, defaults to `5001`.
- **CORS Allowed Origins**: `http://localhost:3000` (development client) with `credentials: true`.
- **Cross-Domain Communication**: All communications between `cbtmcq-ui` and `CBTMCQ` must occur over HTTP REST endpoints documented in `specs/openapi.yaml`.

---

## 5. Article IV: Layered Architecture & Separation of Concerns

The repository structure enforces clean separation across four distinct layers:

```
CBTMCQ/
├── config/
│   └── rbac-policy.yaml        # Declarative Access Control Rules
├── specs/
│   └── openapi.yaml            # OpenAPI 3.1 Spec (Single Source of Truth)
├── database/
│   ├── init.js                 # MongoDB connection lifecycle
│   └── models/                 # Mongoose schemas & data integrity rules
├── entities/
│   └── <domain>/               # Domain modules (users, subjects, questions, tests)
│       ├── routes/             # Route mapping & URL definitions
│       ├── controllers/        # HTTP validation, status codes, orchestration
│       └── services/           # Pure business logic, computations, db access
├── middlewares/
│   ├── auth.js                 # Session / Token extractor
│   └── rbacGuard.js            # Single declarative RBAC engine
├── index.js                    # Server entrypoint & middleware mounting
└── Constitution.md             # Project Constitution & SDD Guidelines
```

### Architectural Guardrails:

1. **Routes**: Responsible strictly for attaching endpoints to controller methods. Must not execute business logic.
2. **Controllers**: Responsible for parsing request payloads, delegating to services, and returning standard JSON envelopes with exact HTTP status codes. Controllers do not run raw Mongoose queries.
3. **Services**: Reusable, pure-logic functions handling database operations and business computations. Services must not accept or touch Express `req` or `res` objects.
4. **Models**: Centralized Mongoose schemas defining constraints, default values, and compound indexes.

---

## 6. Article V: Domain Entity Specifications

| Entity             | Primary Responsibilities                              | Data Key Fields                                                                                       | Roles with Write Access          |
| :----------------- | :---------------------------------------------------- | :---------------------------------------------------------------------------------------------------- | :------------------------------- |
| **`User`**         | Identity, authentication, role governance             | `username`, `email`, `role`, `academicYear`, `password` (bcrypt)                                      | `ADMIN`, `PUBLIC` (registration) |
| **`Subject`**      | Academic course management                            | `subjectCode`, `subjectName`, `academicYear`, `credits`, `createdBy`                                  | `ADMIN`, `FACULTY`               |
| **`Question`**     | Multi-type question bank (`MCQ`, `MSQ`, `True/False`) | `subjectId`, `questionText`, `questionType`, `options`, `difficulty.level`, `difficulty.weight`       | `ADMIN`, `FACULTY`               |
| **`Test`**         | Examination configuration & scheduling                | `testName`, `academicYear`, `subjects`, `testType`, `duration`, `totalMarks`, `schedule`              | `ADMIN`, `FACULTY`               |
| **`TestQuestion`** | Mapping questions to tests with weights               | `testId`, `questionId`, `assignedMarks`, `sequenceNumber`, `section`                                  | `ADMIN`, `FACULTY`               |
| **`UserResponse`** | Candidate real-time answer submissions                | `userId`, `testQuestionId`, `selectedOptionIds`, `status`, `timeSpent`                                | `STUDENT`                        |
| **`TestResult`**   | Final test grading and performance analytics          | `userId`, `testId`, `totalMarksObtained`, `percentage`, `subjectWiseBreakdown`, `difficultyBreakdown` | `SYSTEM` (Automated Engine)      |

---

## 7. Article VI: OpenAPI Specification Standard

### Standard API Response Envelope

All API endpoints generated in accordance with `specs/openapi.yaml` must return responses conforming to the canonical envelope:

#### Success Envelope (`200 OK`, `201 Created`):

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

#### Error Envelope (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`):

```json
{
  "success": false,
  "message": "Descriptive error message",
  "error": "SPEC_ERROR_CODE",
  "details": []
}
```

---

## 8. Article VII: Database Model & Schema Governance Specification

All Mongoose schemas in `database/models/` must adhere to rigorous data governance, immutability, and security rules:

```
┌────────────────────────────────────────────────────────┐
│           MONGOOSE SCHEMA ENFORCEMENT STACK            │
├────────────────────────────────────────────────────────┤
│ 1. Strict Typing       │ strict: 'throw' / strict: true│
│ 2. Field Sanitization  │ trim: true, custom validators │
│ 3. Field Immutability  │ immutable: true on keys & refs│
│ 4. Compound Uniqueness │ Explicit index definitions    │
│ 5. Lifecycle Hooks     │ pre('save') bcrypt, weights   │
│ 6. Privacy Transform   │ toJSON strips password & __v  │
└────────────────────────────────────────────────────────┘
```

### Rule DB-001: Strict Typing & Extra Field Prohibition

- Every schema must explicitly enable `timestamps: true` (`createdAt`, `updatedAt`).
- Schemas must enforce `strict: true` (or `strict: 'throw'`) to disallow unauthorized, unmodeled properties from being persisted (preventing mass assignment vulnerabilities).

### Rule DB-002: Field Sanitization & Custom Validators

- **String Sanitization**: `trim: true` is mandatory on all String fields.
- **Enums**: All enums must be explicit and uppercase (e.g., `['ADMIN', 'FACULTY', 'STUDENT']`, `['MCQ', 'MSQ', 'TRUE_FALSE']`).
- **Input Validation**: Use standard validators (e.g., `validator.isEmail` on `User.email`).
- **Subdocument Constraints**:
  - `Question.options` must contain $\ge 2$ options for `MCQ`/`MSQ`.
  - At least one option in `Question.options` must have `isCorrect: true`.

### Rule DB-003: Immutability Enforcements

To guarantee academic auditability and prevent historical data corruption, critical relationship and audit fields must be declared with `immutable: true`:

- `User.username`, `User.role` (once registered, role escalations must use administrative workflows).
- `Subject.subjectCode`, `Subject.createdBy`.
- `Test.createdBy`.
- `TestQuestion.testId`, `TestQuestion.questionId`.
- `UserResponse.userId`, `UserResponse.testQuestionId`.
- `TestResult.userId`, `TestResult.testId`, `TestResult.startedAt`.

### Rule DB-004: Compound Uniqueness & Index Governance

Every collection must declare explicit indexes to guarantee data consistency and query performance:

- **`TestResult`**: `{ userId: 1, testId: 1 }` with `{ unique: true }` (prevents duplicate test completions).
- **`UserResponse`**: `{ userId: 1, testQuestionId: 1 }` with `{ unique: true }` (ensures idempotent response updates).
- **`TestQuestion`**: `{ testId: 1, questionId: 1 }` with `{ unique: true }` and `{ testId: 1, sequenceNumber: 1 }` with `{ unique: true }` (ensures unique ordering and no duplicate questions per test).
- **`Subject`**: `{ subjectCode: 1 }` with `{ unique: true }`.
- **`User`**: `{ username: 1 }` and `{ email: 1 }` with `{ unique: true }`.

### Rule DB-005: Lifecycle Hooks (Pre/Post Middleware)

- **Automatic Password Hashing**: `userSchema.pre('save', ...)` must automatically hash plain-text passwords using `bcrypt` if modified.
- **Dynamic Field Computations**: Calculate derived weights (e.g., `Question.difficulty.weight`) automatically via pre-save hooks rather than requiring manual controller calculations.
- **Referential Integrity Guards**: Pre-remove hooks must prevent deleting parent documents (e.g., `Subject`) if active dependent records (`Test`, `Question`) exist.

### Rule DB-006: Serialization & Data Privacy (`toJSON` Transforms)

- Sensitive fields (`password`, `resetPasswordToken`, `__v`) must never be leaked through `res.json()`.
- Every schema that stores sensitive or internal metadata must define a `toJSON` transform:

```javascript
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.__v;
    return ret;
  }
});
```

### Rule DB-007: Spec-to-Schema Synchronization

Every Mongoose model must maintain exact property name, type, and constraint parity with its corresponding schema defined in `specs/openapi.yaml#/components/schemas`.

---

## 9. Article VIII: Denial of Service (DoS / DDoS) Defensive Gates

To safeguard university testing integrity and prevent service outages during peak exam surges or distributed volumetric attacks, the system enforces a **Multi-Tiered DDoS Defense Architecture**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PERIMETER DDoS MITIGATION STACK                      │
├─────────────────────────┬──────────────────────────────────────────────┤
│ Tier 1: Global Limiter  │ Max 300 req / 15 min per IP                  │
│ Tier 2: Auth Gate       │ Max 5-10 req / 15 min per IP (Brute-force)   │
│ Tier 3: Exam Save Gate  │ Token bucket (1 req / 2s per session)        │
│ Tier 4: Payload Caps    │ Max 50kb request bodies (No buffer overflow) │
│ Tier 5: Socket Timeouts │ 10s headers, 20s request (No Slowloris)      │
│ Tier 6: DB Pool Bounds  │ maxPoolSize: 50, query maxLimit: 100         │
│ Tier 7: Edge Proxy Sync │ trust proxy enabled for verified IP lookup   │
└─────────────────────────┴──────────────────────────────────────────────┘
```

### Rule DDOS-001: Multi-Tier Perimeter Rate Limiting

All rate limiting is managed at the perimeter using sliding-window rate limiters configured via `config/ddos-policy.yaml`:

1. **Tier 1 (Global Perimeter Gate)**:
   - Limits aggregate traffic to **300 requests per 15 minutes** per client IP.
   - Prevents generic site-scraping, denial-of-service floods, and bot scanning.
2. **Tier 2 (Authentication & Registration Hardening Gate)**:
   - Enforces a strict cap of **5 to 10 requests per 15 minutes** per client IP on `/users/login` and `/users/signup`.
   - Prevents credential stuffing, password spraying, and mass registration floods.
   - Employs exponential backoff headers on successive failures.
3. **Tier 3 (Exam Submission Burst & Autosave Gate)**:
   - Enforces session-based token bucket throttling on exam submission endpoints (`/userResponse`, `/tests/:id/submit`).
   - Caps autosaves at **1 request per 2 seconds** per active student session.
   - Smoothly accommodates legitimate rapid keystroke autosaves while rejecting automated script floods that could lock database collections.
4. **Standard 429 Protocol**:
   - Throttled requests must immediately return `429 Too Many Requests` with standard RFC headers:
     - `Retry-After: <seconds>`
     - `RateLimit-Limit: <limit>`
     - `RateLimit-Remaining: 0`
     - `RateLimit-Reset: <timestamp>`

### Rule DDOS-002: Request Payload & Buffer Overflow Bounds

- The Express body parser must enforce strict payload caps:
  ```javascript
  app.use(express.json({ limit: "50kb" }));
  app.use(express.urlencoded({ limit: "50kb", extended: true }));
  ```
- Any request exceeding `50kb` must be aborted immediately by middleware with `413 Payload Too Large`, preventing memory exhaustion and zip-bomb style JSON payload attacks.

### Rule DDOS-003: Slowloris & Socket Starvation Prevention

- The underlying HTTP server must configure strict socket timeouts to prevent Slowloris attacks (attackers slowly trickling bytes to keep TCP sockets open and exhaust server worker pools):
  ```javascript
  const server = app.listen(port, ...);
  server.headersTimeout = 10000;    // 10 seconds to send all HTTP headers
  server.requestTimeout = 20000;    // 20 seconds total request duration
  server.keepAliveTimeout = 5000;   // 5 seconds keep-alive idle cap
  ```

### Rule DDOS-004: Query Complexity & ReDoS Defense

- **Unbounded Query Prohibition**: No service or controller may issue an unbounded `.find({})` query.
- **Strict Pagination Cap**: All list endpoints must enforce a mandatory maximum limit of **100 documents per query** (`Math.min(limit, 100)`).
- **Regular Expression DoS (ReDoS)**: User-provided search strings must never be passed unescaped into `new RegExp(query)`. They must be sanitized using a regex escape utility to prevent catastrophic regex backtracking.

### Rule DDOS-005: Database Connection Pool Throttling

- The Mongoose connection pool must be explicitly bounded to prevent connection starvation under sudden traffic surges:
  ```javascript
  mongoose.connect(uri, {
    maxPoolSize: 50, // Max active concurrent connections
    minPoolSize: 5, // Maintain warm connections
    serverSelectionTimeoutMS: 5000, // Fail fast after 5s rather than hang
    socketTimeoutMS: 30000 // Terminate dead queries after 30s
  });
  ```

### Rule DDOS-006: Reverse Proxy & Trusted Proxy Header Standards

- To ensure client IP addresses cannot be spoofed via forged `X-Forwarded-For` HTTP headers, Express must be configured with:
  ```javascript
  app.set("trust proxy", 1); // Trust first hop reverse proxy (Cloudflare / Nginx / AWS ALB)
  ```
- Rate limiters must extract client IPs using the verified proxy-resolved `req.ip`.

---

## 10. Article IX: Queryable Flat Schema Views & Aggregation Engine (CQRS Read Layer)

### 10.1 Feasibility Assessment

**Status: Highly Feasible & Architecturally Sound.**  
In an academic testing system, the UI frequently requires composite, denormalized data (e.g., student name + test metadata + subject code + scores + question stats). Forcing the UI to execute multiple REST roundtrips causes "chatty" network latency, client-side data stitching overhead, and increased server load.

To resolve this, `CBTMCQ` adopts a **REST-Native Queryable Flat View Engine** built upon MongoDB Aggregation Pipelines (`$lookup`, `$match`, `$project`, `$sort`, `$limit`). This provides GraphQL-like field selection and cross-entity joining capabilities through clean, single REST endpoints without the overhead of GraphQL runtime dependencies.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              FLAT SCHEMA VIEW PIPELINE                                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ UI Single Request ]                                                                  │
│   GET /views/test-results?select=studentName,testName,score&orderBy=score:desc&limit=10  │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. Parameter Validation & Whitelist Guard (middlewares/viewGuard.js)                   │
│    - Validates ?select fields against registered View Schema whitelist                 │
│    - Strips unauthorized/internal fields (password, tokens, __v)                       │
│    - Enforces pagination ceiling: Math.min(limit, 100)                                 │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. MongoDB Aggregation Pipeline Generator                                              │
│    - Stage 1: $match (Indexed filters, tenant/user scoping)                            │
│    - Stage 2: $lookup (Cross-collection/cross-db joins: Users, Tests, Subjects)        │
│    - Stage 3: $unwind / $addFields (Flatten nested structures)                         │
│    - Stage 4: $sort (Validated orderBy criteria)                                      │
│    - Stage 5: $project (Dynamic projection based on ?select)                           │
│    - Stage 6: $limit & $skip (Pagination bounds)                                       │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [ Single Flattened JSON Response to UI ]                                               │
│   { "success": true, "data": [ { "studentName": "...", "testName": "...", ... } ] }    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Rule VIEW-001: REST Parameter & Query Protocol

All flat view calls shall conform to standard REST query syntax:

- **`select`**: Comma-delimited list of fields to project (e.g., `?select=studentName,score,subjectCode`).
- **`orderBy`**: Field and direction formatted as `<field>:<asc|desc>` (e.g., `?orderBy=score:desc`).
- **`limit`**: Positive integer bounded between `1` and `100` (defaults to `20`).
- **`page` / `skip`**: Offset for pagination.
- **`filter`**: URL-encoded key-value filter parameters scoped to indexed fields (e.g., `?academicYear=2&testType=MIDTERM`).

### Rule VIEW-002: Whitelist Security & Projection Injection Prevention

To prevent arbitrary query injection, unauthorized data exfiltration, or denial of service:

1. **Strict Field Whitelist**: Each view must be registered in the View Registry with an explicit list of queryable, sortable, and selectable fields.
2. **Denial of Undeclared Fields**: Any request attempting to `select` or `orderBy` a field not present in the view's whitelist must be rejected immediately with `400 Bad Request`.
3. **Hard Exclusion of Sensitive Fields**: Fields containing credentials (`password`, `resetPasswordToken`), private keys, or system internals (`__v`) are permanently excluded from all view projections.
4. **No Raw Query Evaluation**: Query strings must never be converted directly into raw MongoDB queries or `$where` JavaScript evaluations.

### Rule VIEW-003: Registered Canonical Views

The system pre-registers the following optimized flat schema views:

| View Name                    | Source Collections Joined                            | Purpose & Flattened Projection                                                | Allowed Roles                        |
| :--------------------------- | :--------------------------------------------------- | :---------------------------------------------------------------------------- | :----------------------------------- |
| **`test-sessions`**          | `Test` + `Subject` + `User` (Faculty)                | Active exam roster, subject details, duration, passing score, instructor info | `STUDENT`, `FACULTY`                 |
| **`student-results`**        | `TestResult` + `Test` + `User` (Student) + `Subject` | Comprehensive scorecards, percentage, student info, subject breakdown         | `STUDENT` (self), `FACULTY`, `ADMIN` |
| **`question-bank-overview`** | `Question` + `Subject` + `User` (Author)             | Question text, options count, difficulty, subject name, usage history         | `FACULTY`, `ADMIN`                   |
| **`exam-monitoring`**        | `UserResponse` + `TestQuestion` + `User`             | Real-time candidate exam progression, time spent, attempted counts            | `FACULTY`, `ADMIN`                   |
| **`test-leaderboard`**       | `TestResult` + `User` (Student) + `Test`             | Dense-ranked candidate scorecards, percentages, and completion rankings       | `STUDENT`, `FACULTY`, `ADMIN`        |
| **`test-leaderboard`**       | `TestResult` + `User` (Student) + `Test`             | Dense-ranked candidate scorecards, percentages, and completion rankings       | `STUDENT`, `FACULTY`, `ADMIN`        |

### Rule VIEW-004: Performance & Indexing Requirements

- **Match-First Principle**: Every view aggregation pipeline must begin with an indexed `$match` stage (e.g., `{ userId: req.user._id }` or `{ testId: requestedTestId }`) before executing `$lookup` joins, preventing full-collection scan joins.
- **Cross-Database Joins**: Where collections reside across separate databases or sharded clusters, `$lookup` stages must leverage MongoDB 5.1+ foreign database references or dedicated materialized read models.

---

## 11. Article X: Live Test Engine Architecture (Security, Time-Locking & Evaluation)

The Live Test engine is the core mission-critical module of `CBTMCQ`. Because tests determine academic credentials, the engine must guarantee anti-cheat protection, tamper-proof time locking, deterministic per-student question/option shuffling, and atomic grading.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              LIVE TEST LIFECYCLE ENGINE                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Session Initialization (POST /tests/:id/start)                                      │
│    - Validate student eligibility & active schedule window                             │
│    - Calculate server-authoritative expiresAt: Math.min(now + duration, endTime)       │
│    - Execute & persist per-student Fisher-Yates Question & Option Shuffling             │
│    - State: IN_PROGRESS (Atomic lock prevents duplicate sessions)                      │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. Zero-Knowledge Question Delivery (GET /tests/:id/session)                           │
│    - Deliver questions in student's persisted shuffled order                           │
│    - CRITICAL: Strip isCorrect, correctOptionIds, and explanations from response      │
│    - Client DevTools / Network tab inspection yields zero answer information           │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. Active Exam Loop (Autosave & Time Sync)                                             │
│    - Sync Time: GET /tests/:id/session/sync (Server-authoritative clock)               │
│    - Autosave: POST /userResponse (Upsert on { userId, testQuestionId })               │
│    - Rate limited to 1 req / 2s per session to prevent DB lock contention              │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 4. Atomic Submission & Grading (POST /tests/:id/submit OR Auto-Expiry)                 │
│    - Verify now <= expiresAt + 5s (Grace window)                                       │
│    - Atomically transition session state: IN_PROGRESS -> SUBMITTED                     │
│    - Server-side grading: compare UserResponse against canonical Question.options      │
│    - Generate immutable TestResult (score, percentage, subject & difficulty breakdowns)│
│    - Result Release Gate: Withhold answer keys until schedule.endTime passes           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Rule LIVE-001: Zero-Knowledge Client Projection (Anti-Cheat Standard)

- While a test session is `SCHEDULED` or `IN_PROGRESS`, the backend **must never** expose `isCorrect`, option explanations, or answer keys in any API response.
- Question options sent to the client must only contain:
  ```json
  {
    "_id": "60d5ec49f1b2c8b1f8e4e1a1",
    "text": "Option text only"
  }
  ```
- Any controller or service violating this rule and transmitting answer keys to active test-takers constitutes a critical security vulnerability.

### Rule LIVE-002: Persisted Random Shuffling (Per-Student Unique & Reconnect-Safe)

- To prevent student collusion and screen peeking, each test taker receives a distinct, randomized arrangement of:
  1. **Question sequence order**.
  2. **Option sequence order** for every question.
- **Persistence Mandate**: The shuffled sequences must be computed **once** at session start and permanently recorded in `TestSession.shuffledQuestions`:
  ```javascript
  shuffledQuestions: [
    {
      questionId: ObjectId("..."),
      optionOrder: [ObjectId("optB"), ObjectId("optA"), ObjectId("optD"), ObjectId("optC")]
    }
  ];
  ```
- **Disconnection Resilience**: If a student refreshes their browser, loses power, or switches network connections, they must resume with the exact same question order and option layout, with all previously saved answers intact.

### Rule LIVE-003: Server-Authoritative Time-Locking

- The client-side countdown timer is purely a visual UI affordance.
- **Clock Authority**: The server alone governs session validity and remaining duration:
  $$\text{sessionExpiresAt} = \min(\text{startedAt} + \text{test.duration} \times 60000, \text{test.schedule.endTime})$$
  $$\text{remainingSeconds} = \max\left(0, \left\lfloor \frac{\text{sessionExpiresAt} - \text{Date.now()}}{1000} \right\rfloor \right)$$
- **Tamper Immunity**: Manipulating local laptop clocks, halting client JavaScript execution, or network disconnection does not pause the server countdown.
- **Enforced Auto-Expiry**: Any submission received after $\text{sessionExpiresAt} + 5000\text{ms}$ (network transit grace) is rejected with `403 Forbidden` (`SESSION_EXPIRED`), and the session is transitioned to `TIMED_OUT`.

### Rule LIVE-004: Session State Machine & Concurrency Control

Each test attempt is governed by an explicit `TestSession` lifecycle:

$$\text{SCHEDULED} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \begin{cases} \text{SUBMITTED} \\ \text{TIMED\_OUT} \end{cases} \longrightarrow \text{EVALUATED}$$

- **Single Active Session Guarantee**: A unique compound index on `{ userId: 1, testId: 1 }` guarantees that a student cannot spawn concurrent test sessions or re-attempt an exam without explicit administrative reset.
- **Atomic Locking**: When a student submits, a MongoDB atomic update transitions `status` from `IN_PROGRESS` to `SUBMITTED`. Subsequent answer modification requests are rejected.

### Rule LIVE-005: Idempotent Real-Time Autosave

- The UI transmits student responses continuously via `POST /userResponse`.
- The database operation must perform an idempotent `findOneAndUpdate` with `upsert: true` on `{ userId, testQuestionId }`:
  ```javascript
  await UserResponse.findOneAndUpdate(
    { userId: req.user._id, testQuestionId },
    {
      selectedOptionIds: body.selectedOptionIds,
      status: body.status, // ATTEMPTED | UNATTEMPTED | MARKED_REVIEW
      timeSpent: body.timeSpent
    },
    { upsert: true, new: true }
  );
  ```
- Governed by **Tier 3 DDoS Rate Limiter** (1 request per 2 seconds per session) to prevent client script loops from saturating database IOPS.

### Rule LIVE-006: Server-Side Grading Engine & Result Release Policy

1. **Server-Side Evaluation**:
   - Compares candidate `selectedOptionIds` against canonical `Question.options.isCorrect`.
   - Supports:
     - Single-answer MCQs (`selectedOptionIds[0] === correctOptionId`).
     - Multi-select MSQs (all correct options selected, no incorrect options selected).
     - Configurable negative marking (if specified on the `Test` entity).
2. **Result Release Governance**:
   - **Practice / Mock Tests (`testType === 'MOCK'`)**: Scores, answer keys, and explanations may be released immediately upon submission.
   - **Formal University Exams (`MIDTERM`, `ENDTERM`, `QUIZ`)**: Scores, answer keys, and subject breakdowns are strictly withheld until `test.schedule.endTime` has passed globally, preventing early submitters from leaking questions to classmates.

### Rule LIVE-007: Student Explicit Save Progress & Checkpoint State

- In addition to real-time response autosave, students are permitted to explicitly save their overall test progress via `POST /tests/:id/session/save-progress`.
- The progress payload records:
  - `currentQuestionIndex`: Number representing the student's active question.
  - `paletteState`: Explicit map of question IDs to candidate review flags (`ATTEMPTED`, `UNATTEMPTED`, `MARKED_REVIEW`).
  - `timeSpent`: Cumulative seconds spent up to this checkpoint.
- **State Recovery**: When a student resumes an active session on any authorized device, the response includes `currentQuestionIndex` and the persisted `paletteState`, allowing the frontend UI to reconstruct the exact exam position and navigation palette.

### Rule LIVE-008: Atomic Session Preemption & Resilient Device Migration (Anti-Cheat Single Login)

To simultaneously prevent collaborative cheating (two people taking the test concurrently) while **guaranteeing resilience for students whose connection drops, battery dies, or device crashes mid-test**:

```
[ Device A (Laptop Crashes / Drops Offline) ]               [ Device B (Friend / Lab Workstation) ]
                     │                                                      │
             (Drops Offline)                                                │
                     │                                                      ▼
                     │                                             POST /users/login
                     │                                                      │
                     │                                                      ▼
                     │                                            Active Exam Detected!
                     │                                            (IN_PROGRESS on Device A)
                     │                                                      │
                     │                                                      ▼
                     │                                            [ ATOMIC SESSION TAKEOVER ]
                     │                                            1. Instantly revoke sess_A
                     │                                            2. Rebind TestSession to sess_B
                     │                                            3. Append migration audit entry
                     │                                                      │
                     │                                                      ▼
                     │                                             HTTP 200 OK (Login successful)
                     │                                             activeSessionId = "sess_B"
                     │                                                      │
                     │                                                      ▼
                     │                                             GET /tests/:id/session
                     │                                             - Exact question/option sequence
                     │                                             - Exact remaining time clock
                     │                                             - All previous answers intact!
                     ▼                                                      │
(If Device A wakes up and attempts submission)                              ▼
POST /userResponse (with old sess_A)                               POST /userResponse (with sess_B)
                     │                                                      │
                     ▼                                                      ▼
           HTTP 401 Unauthorized                                      HTTP 200 OK
      (SESSION_REVOKED_BY_NEW_LOGIN)                               (Answer saved successfully)
```

#### Protocol Specification:

1. **Single Active Session at Any Instant**:
   - Exactly **one active authenticated session** is valid per user at any millisecond in time.
   - The `User` collection records `activeSessionId: string` and `lastLoginAt: Date`.
2. **Atomic Session Preemption (Takeover, Not Lockout)**:
   - When a student's laptop crashes and they log in on a new device (`POST /users/login`), the server **does not block them**.
   - Instead, the server performs an **atomic takeover**:
     1. The previous session (`sess_A`) is instantly revoked in the server session store.
     2. `User.activeSessionId` is reassigned to the new session (`sess_B`).
     3. The active `TestSession` rebinds `associatedSessionId = "sess_B"`.
     4. A migration audit record is appended to `TestSession.migrationHistory` (`fromSessionId`, `toSessionId`, `fromIp`, `toIp`, `migratedAt`).
3. **Resilient Exam Resumption (Zero Work Lost)**:
   - Device B calls `GET /tests/:id/session`.
   - The student resumes immediately with:
     - The **exact persisted question and option shuffle** they started with.
     - The **exact server countdown time** remaining.
     - All **previously autosaved answers** and the `currentQuestionIndex` checkpoint restored.
4. **Displaced Device Lockout**:
   - If Device A reconnects or tries to send answers, authentication middleware detects `sess_A !== user.activeSessionId` and terminates it with `401 Unauthorized` (`SESSION_REVOKED_BY_NEW_LOGIN`: _"Your session was transferred to another device. If this was not you, contact your proctor immediately."_).
   - This eliminates the possibility of two people solving the test simultaneously.
5. **Anti-Flapping & Audit Governance**:
   - **Cooldown Gate**: A mandatory 30-second cooldown is enforced between successive device migrations to prevent script-based login ping-ponging.
   - **Migration Limit**: A maximum of **3 device migrations** is allowed per exam attempt. Exceeding 3 migrations flags the session as `EXCESSIVE_MIGRATIONS` and requires a proctor/faculty unlock code.

### Rule LIVE-009: Test Publishing & Student Enrollment Lifecycle

To reconcile future-scheduled exams with advance enrollment and eliminate schema discrepancies between `TestSession` and `UserResponse`:

1. **Separation of Master Test Window vs. Student Session Duration (Issue 1 Resolution)**:
   - **Master Exam Window (`Test.schedule`)**: Governed by `startTime` (when the test opens globally) and `endTime` (when the test closes globally).
   - **Student Enrollment Lifecycle (`TestSession`)**:
     - When a student self-enrolls (`POST /tests/:id/enroll`) or is enrolled by faculty/admin (`POST /tests/:id/enroll-students`), the `TestSession` document is pre-created in `SCHEDULED` status with `enrolledAt = Date.now()`.
     - `startedAt` and `expiresAt` are initialized to `null`. They **must not** default to `Date.now()` or be marked `immutable: true` at document creation, as doing so would prematurely lock the student's timer before the exam begins.
     - When the student enters the exam during the master test window via `POST /tests/:id/start`, `status` transitions from `SCHEDULED` to `IN_PROGRESS`, setting `startedAt = Date.now()` and computing:
       $$\text{expiresAt} = \min(\text{startedAt} + \text{test.duration} \times 60000, \text{test.schedule.endTime})$$
2. **Unified Dual Question Identifier Mapping (Issue 2 Resolution)**:
   - To eliminate impedance mismatch between `Question` (content bank), `TestQuestion` (test paper composition), and `UserResponse` (candidate answer record):
   - `TestSession.shuffledQuestions` explicitly records both identifiers:
     ```typescript
     export interface IShuffledQuestion {
       testQuestionId: Types.ObjectId; // References TestQuestion (for paletteState and UserResponse matching)
       questionId: Types.ObjectId; // References Question (for question text and option content)
       sequenceNumber: number; // 1-based shuffled position for this student
       optionOrder: Array<Types.ObjectId>; // Shuffled option IDs for this student
     }
     ```
   - Client applications receive `testQuestionId` and `questionId` in the session payload.
   - Autosave operations (`POST /userResponse` or `POST /tests/:id/session/answer`) key directly on `testQuestionId`, perfectly matching `UserResponse.testQuestionId` and the `paletteState` map keys without requiring client-side translation.
3. **Enrollment Discovery Gate**:
   - Students querying `GET /tests/available` receive all active, published tests (`isPublished: true`, `isActive: true`) matching their `academicYear`.
   - Each returned test includes an `isEnrolled: boolean` indicator and `sessionStatus` (`null`, `"SCHEDULED"`, `"IN_PROGRESS"`, `"SUBMITTED"`).

### Rule LIVE-010: Post-Exam Review Protocol & Result Release Enforcement

To provide an intuitive learning loop post-assessment while strictly preserving exam integrity:

1. **Dedicated Tree Review Endpoint (`GET /tests/:id/session/review`)**:
   - Rather than forcing multi-layered test papers into 2D flat views or reusing mutating live endpoints, post-test review is served via a dedicated endpoint: `GET /tests/:id/session/review`.
   - **Contract Parity**: The response mirrors the JSON schema of `POST /tests/:id/start` 1:1, allowing client applications to reuse the exact same `TestScreen` / `TestInterface` component by toggling `isReviewMode: true`.
   - **Payload Enrichment**:
     - Preserves the student's unique persisted Fisher-Yates `shuffledQuestions` and `optionOrder`.
     - Populates `isCorrect: boolean` and `explanation: string` for all options.
     - Merges candidate choices (`studentSelectedOptionIds`, `studentStatus`, `timeSpent`) from `UserResponse`.
     - Provides scorecard metrics (`score`, `percentage`, `passed`, `attemptedCount`, `correctCount`).
2. **Result Release Security Gate**:
   - **Practice / Mock Tests (`testType === 'MOCK'`)**: Review payload is released immediately upon submission (`status === 'SUBMITTED'`).
   - **Formal University Exams (`MIDTERM`, `ENDTERM`, `QUIZ`)**: If `Date.now() < test.schedule.endTime`, access to `GET /tests/:id/session/review` is blocked with `403 Forbidden` (`RESULT_WITHHELD`), preventing students who finish early from leaking answer keys to classmates.
3. **Session State Prerequisite**:
   - Review is strictly forbidden for active or scheduled sessions. Any request for a session with `status === 'IN_PROGRESS'` or `status === 'SCHEDULED'` is rejected with `400 Bad Request` (`SESSION_NOT_SUBMITTED`).

---

## 12. Article XI: Strict TypeScript Engineering & Class Standard (Zero-Any, Zero-Undefined, Object Discipline)

All codebase implementations in `CBTMCQ` must be written in **Strict TypeScript**. To ensure absolute runtime predictability, memory safety, and complete type-checker coverage, the following axioms are non-negotiable:

```
┌────────────────────────────────────────────────────────────────────────┐
│               STRICT TYPESCRIPT AXIOMS & OBJECT RULES                  │
├─────────────────────────┬──────────────────────────────────────────────┤
│ 1. Zero-Any Policy      │ No 'any' type permitted anywhere in codebase │
│ 2. Zero-Undefined Policy│ No 'undefined'; use Null-Objects or defaults │
│ 3. Primitive Defaults   │ number=0, string="", boolean=false           │
│ 4. No [] or {} Literals │ All arrays & objects instantiated from class │
│ 5. Mandatory toString() │ Prints all member names and values           │
│ 6. Mandatory equals()   │ Member function for deep equality comparison │
│ 7. Mandatory isEmpty()  │ Checks if instance is in default/empty state │
│ 8. Mandatory isNull()   │ Evaluates null-object / unassigned state     │
└─────────────────────────┴──────────────────────────────────────────────┘
```

### Rule TS-001: Strict TypeScript Mandate & Compiler Flags

The project compiler configuration (`tsconfig.json`) must enforce the strictest type-checking tier:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Rule TS-002: Zero-Any & Zero-Undefined Policy

1. **Absolute Ban on `any`**:
   - The type keyword `any` is strictly prohibited across all variables, parameters, return types, interfaces, generics, and type assertions.
   - For unknown or dynamic data, use strongly typed generics, union types, or `unknown` narrowed with exhaustive type guards.
2. **Absolute Ban on `undefined`**:
   - Neither variables, object fields, nor function return types may be `undefined`.
   - Fields that might have no value must use an explicit class-level empty instance (Null Object Pattern) or an explicit `null` with strict handling.

### Rule TS-003: Primitive Default Minimum Initialization

Every newly declared primitive variable or class field must be initialized immediately with its minimum standard default:

- **`number`**: Initialized to `0`
- **`string`**: Initialized to `""` (empty string)
- **`boolean`**: Initialized to `false`
- **`bigint`**: Initialized to `0n`
  Uninitialized variable declarations (e.g., `let x: number;`) are strictly forbidden.

### Rule TS-004: Non-Primitive Class Instantiation (Prohibition of Literal `[]` and `{}`)

1. **Arrays and Lists**:
   - Instantiating arrays with the literal `[]` is forbidden in domain code.
   - Arrays and collections must be instantiated via class constructors:
     ```typescript
     // FORBIDDEN:
     const list = [];

     // REQUIRED:
     const list: Array<Question> = new Array<Question>();
     // OR custom typed collection class:
     const list: List<Question> = new List<Question>();
     ```
2. **Objects**:
   - Instantiating objects with literal `{}` is forbidden for domain entities, DTOs, and value objects.
   - Objects must be instantiated from explicit classes via their constructors or static empty factory methods:
     ```typescript
     // FORBIDDEN:
     const user = {};

     // REQUIRED:
     const user: User = new User();
     const session: TestSession = TestSession.empty();
     ```

### Rule TS-005: Mandatory Class Member Functions (`BaseObject` Contract)

Every class representing entities, value objects, request/response DTOs, or domain structures must inherit from or implement the canonical `BaseObject` contract:

```typescript
export interface IBaseObject<T> {
  toString(): string;
  equals(other: T): boolean;
  isEmpty(): boolean;
  isNull(): boolean;
}
```

#### Required Method Semantics:

1. **`.toString(): string`**:
   - Must output a serialized string representing all field names and their current values.
   - Example output: `User{ id: "usr_1", username: "john", role: "STUDENT", academicYear: 1 }`.
2. **`.equals(other: this): boolean`**:
   - Must perform deterministic field-by-field equality comparison between this instance and `other`.
3. **`.isEmpty(): boolean`**:
   - Returns `true` if all member fields equal their default initial states (`0`, `""`, `false`, `new Array<T>()`).
4. **`.isNull(): boolean`**:
   - Returns `true` if the object represents a sentinel or Null-Object instance, enabling safe method chaining without null pointer exceptions.

---

## 13. Article XII: Mandatory Code Quality & Build Verification Gates (CI/Pre-Commit Pipeline)

Before any commit, pull request, or deployment, the codebase must pass **four non-negotiable verification gates**. Failure of any single gate strictly blocks merging or deployment.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MANDATORY CODE VERIFICATION GATES                    │
├────────┬─────────────────┬─────────────────────────────────────────────┤
│ Gate 1 │ Typecheck Pass  │ tsc --noEmit (0 type errors)                │
│ Gate 2 │ Lint Pass       │ eslint --max-warnings 0 (0 warnings/errors) │
│ Gate 3 │ Prettier Check  │ prettier --check (100% formatted)           │
│ Gate 4 │ Build Pass      │ NODE_OPTIONS="--max-old-space-size=6144" tsc│
└────────┴─────────────────┴─────────────────────────────────────────────┘
```

### Gate 1: Typecheck Pass

- **Requirement**: Full static type verification with zero type discrepancies, zero implicit any, and zero unhandled undefined types.
- **Terminal Command**:
  ```bash
  npm run typecheck
  # Equivalent: npx tsc --noEmit
  ```

### Gate 2: Lint Pass (0 Errors & 0 Warnings)

- **Requirement**: Zero ESLint violations with `--max-warnings 0`. Unused variables, unresolved imports, or any deviation from strict TypeScript rules will trigger immediate failure.
- **Terminal Command**:
  ```bash
  npm run lint
  # Equivalent: npx eslint . --ext .ts,.js --max-warnings 0
  ```
- **Auto-Fix Command**:
  ```bash
  npm run lint:fix
  ```

### Gate 3: Prettier Code Style Check

- **Requirement**: All TypeScript, JavaScript, JSON, Markdown, and YAML files must conform exactly to project formatting rules (2-space indent, double quotes, no trailing commas).
- **Terminal Command**:
  ```bash
  npm run format:check
  # Equivalent: npx prettier --check "**/*.{ts,js,json,md,yaml,yml}"
  ```
- **Auto-Format Command**:
  ```bash
  npm run format
  ```

### Gate 4: Build Pass (6 GB Memory Ceiling)

- **Requirement**: Full compilation to JavaScript must complete without errors. To prevent runaway memory leaks or V8 garbage collector stalls during large builds, the Node process is hard-capped at **6 GB (6144 MB)** of heap memory.
- **Terminal Command**:
  ```bash
  npm run build
  # Equivalent: NODE_OPTIONS="--max-old-space-size=6144" npx tsc
  ```

### The Unified Gate Runner

To verify all four gates sequentially in a single invocation before pushing code:

```bash
npm run gates
# Executes: npm run typecheck && npm run lint && npm run format:check && npm run build
```

---

## 14. Article XIII: Spec-Driven Development Definition of Done (DoD)

Before any new API endpoint, flat view, or feature is considered complete and ready for integration, it must pass the following **SDD Gateways**:

- [ ] **Gateway 1 (Spec First)**: The endpoint path, query parameters (`select`, `orderBy`, `limit`), input schemas, headers, rate limits, and responses (including `429` and `413`) are specified in `specs/openapi.yaml`.
- [ ] **Gateway 2 (Access Control)**: The endpoint path and allowed HTTP methods are registered in `config/rbac-policy.yaml` under the appropriate roles.
- [ ] **Gateway 3 (DDoS & Rate Limit Gate)**: The endpoint is assigned to the appropriate rate-limiting tier in `config/ddos-policy.yaml`.
- [ ] **Gateway 4 (Database Schema Enforcement)**: Any new or modified Mongoose model complies with Rules `DB-001` through `DB-007` (strict mode, immutability, compound indexes, `toJSON` privacy transform).
- [ ] **Gateway 5 (Anti-Cheat & Single Login Lock)**: Enforces Rules `LIVE-001` through `LIVE-008` (zero-knowledge option projections, server-authoritative clock, persisted random shuffle, atomic submission lock, save-progress checkpoints, and single active session per user).
- [ ] **Gateway 6 (TypeScript Strict Discipline)**: All code is written in TypeScript conforming to Rules `TS-001` through `TS-005` (zero `any`, zero `undefined`, primitive default minimums, non-primitive class instantiation without `[]` or `{}`, and mandatory `.toString()`, `.equals()`, `.isEmpty()`, `.isNull()` on all classes).
- [ ] **Gateway 7 (View Whitelist Compliance)**: If implementing a flat view, the view is registered with strict field whitelisting, indexed `$match` stages, and mandatory pagination caps (Rules `VIEW-001` to `VIEW-004`).
- [ ] **Gateway 8 (Mandatory Verification Gates)**: Passes all four verification gates via `npm run gates` (typecheck, lint with 0 warnings, prettier check, and 6 GB memory-capped build).
- [ ] **Gateway 9 (Contract & Unit Tests)**: An automated test validates the endpoint using the OpenAPI schema and confirms unauthorized roles receive `403 Forbidden` and rate-limit violations receive `429 Too Many Requests`.
- [ ] **Gateway 10 (Layered Separation)**: Route, Controller, Service, and View layers are cleanly partitioned with no direct database calls in controllers.
- [ ] **Gateway 11 (Zero Secret Exposure)**: Passwords and system credentials are never logged, exposed in error traces, or returned in response bodies.
