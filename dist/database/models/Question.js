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
exports.QuestionModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const optionSchema = new mongoose_1.Schema({
    text: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, required: true, default: false },
    explanation: { type: String, default: "", trim: true }
}, { _id: true });
const questionSchema = new mongoose_1.Schema({
    subjectId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
        immutable: true
    },
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    questionType: {
        type: String,
        enum: ["MCQ", "True/False", "MSQ"],
        default: "MCQ"
    },
    options: {
        type: [optionSchema],
        validate: {
            validator: (opts) => opts.length >= 2,
            message: "A question must contain at least 2 options."
        }
    },
    difficulty: {
        level: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            default: "Medium"
        },
        weight: {
            type: Number,
            default: 1.0
        }
    },
    usageCount: {
        type: Number,
        default: 0
    },
    lastUsed: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        immutable: true
    }
}, {
    timestamps: true,
    strict: true
});
// Automatic weight calculation hook (Rule DB-005)
questionSchema.pre("save", function (next) {
    if (this.difficulty.level === "Easy") {
        this.difficulty.weight = 0.8;
    }
    else if (this.difficulty.level === "Hard") {
        this.difficulty.weight = 1.2;
    }
    else {
        this.difficulty.weight = 1.0;
    }
    next();
});
exports.QuestionModel = mongoose_1.default.model("Question", questionSchema);
exports.default = exports.QuestionModel;
