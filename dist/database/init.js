"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMongoose = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uri = process.env.MONGO_URI || "mongodb://localhost:27017/cbtmcq";
const initMongoose = async () => {
    if (uri.length === 0) {
        throw new Error("MONGO_URI is not defined in environment variables.");
    }
    // Connection options compliant with Rule DDOS-005
    return mongoose_1.default.connect(uri, {
        maxPoolSize: 50,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000
    });
};
exports.initMongoose = initMongoose;
