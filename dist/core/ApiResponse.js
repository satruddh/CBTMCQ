"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
const BaseObject_1 = require("./BaseObject");
class ApiResponse extends BaseObject_1.BaseObject {
    success = false;
    message = "";
    data = null;
    error = "";
    constructor(success = false, message = "", data = null, error = "") {
        super();
        this.success = success;
        this.message = message;
        this.data = data;
        this.error = error;
    }
    static success(message, data) {
        const res = new ApiResponse(true, message, data, "");
        return res;
    }
    static error(message, error = "") {
        const res = new ApiResponse(false, message, null, error);
        return res;
    }
    toString() {
        return `ApiResponse{ success: ${this.success}, message: "${this.message}", error: "${this.error}" }`;
    }
    equals(other) {
        return (this.success === other.success && this.message === other.message && this.error === other.error);
    }
    isEmpty() {
        return !this.success && this.message === "" && this.data === null && this.error === "";
    }
}
exports.ApiResponse = ApiResponse;
