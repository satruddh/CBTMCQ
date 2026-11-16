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
exports.TestResultModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const subjectBreakdownSchema = new mongoose_1.Schema({
    subjectId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Subject", required: true },
    correct: { type: Number, default: 0 },
    incorrect: { type: Number, default: 0 },
    unanswered: { type: Number, default: 0 },
    marksObtained: { type: Number, default: 0 }
}, { _id: false });
const difficultyCountSchema = new mongoose_1.Schema({
    correct: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
}, { _id: false });
const testResultSchema = new mongoose_1.Schema({
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
    startedAt: {
        type: Date,
        required: true,
        immutable: true
    },
    completedAt: {
        type: Date,
        required: true
    },
    totalMarksObtained: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    subjectWiseBreakdown: [subjectBreakdownSchema],
    difficultyBreakdown: {
        easy: { type: difficultyCountSchema, default: () => ({ correct: 0, total: 0 }) },
        medium: { type: difficultyCountSchema, default: () => ({ correct: 0, total: 0 }) },
        hard: { type: difficultyCountSchema, default: () => ({ correct: 0, total: 0 }) }
    }
}, {
    timestamps: true,
    strict: true
});
// Guarantee single final result record per test attempt (Rule DB-004)
testResultSchema.index({ userId: 1, testId: 1 }, { unique: true });
exports.TestResultModel = mongoose_1.default.model("TestResult", testResultSchema);
exports.default = exports.TestResultModel;
