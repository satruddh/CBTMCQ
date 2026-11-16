"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestSessionModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const shuffledQuestionSchema = new mongoose_1.Schema({
    testQuestionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "TestQuestion",
        required: true
    },
    questionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Question",
        required: true
    },
    sequenceNumber: {
        type: Number,
        required: true
    },
    optionOrder: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            required: true
        }
    ]
}, { _id: false });
const migrationRecordSchema = new mongoose_1.Schema({
    fromSessionId: { type: String, required: true },
    toSessionId: { type: String, required: true },
    fromIp: { type: String, default: "" },
    toIp: { type: String, default: "" },
    migratedAt: { type: Date, default: Date.now }
}, { _id: false });
const testSessionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        immutable: true
    },
    testId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Test",
        required: true,
        immutable: true
    },
    status: {
        type: String,
        enum: ["SCHEDULED", "IN_PROGRESS", "SUBMITTED", "TIMED_OUT", "EVALUATED"],
        default: "SCHEDULED"
    },
    enrolledAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    startedAt: {
        type: Date,
        default: null
    },
    expiresAt: {
        type: Date,
        default: null
    },
    submittedAt: {
        type: Date,
        default: null
    },
    clientIp: {
        type: String,
        default: "",
        trim: true
    },
    associatedSessionId: {
        type: String,
        default: "",
        trim: true
    },
    migrationCount: {
        type: Number,
        default: 0
    },
    lastMigrationAt: {
        type: Date,
        default: null
    },
    migrationHistory: [migrationRecordSchema],
    lastHeartbeatAt: {
        type: Date,
        default: Date.now
    },
    currentQuestionIndex: {
        type: Number,
        default: 0,
        min: 0
    },
    paletteState: {
        type: Map,
        of: String,
        default: () => new Map()
    },
    lastSavedAt: {
        type: Date,
        default: Date.now
    },
    shuffledQuestions: [shuffledQuestionSchema]
}, {
    timestamps: true,
    strict: true
});
// Guarantee single active session per student per test (Rule LIVE-004)
testSessionSchema.index({ userId: 1, testId: 1 }, { unique: true });
testSessionSchema.index({ status: 1, expiresAt: 1 });
exports.TestSessionModel = mongoose_1.default.model("TestSession", testSessionSchema);
exports.default = exports.TestSessionModel;
