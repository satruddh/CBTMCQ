"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestSessionState = exports.ShuffledQuestion = void 0;
const BaseObject_1 = require("../core/BaseObject");
class ShuffledQuestion extends BaseObject_1.BaseObject {
    testQuestionId = "";
    questionId = "";
    sequenceNumber = 0;
    optionOrder = new Array();
    constructor(testQuestionId = "", questionId = "", sequenceNumber = 0, optionOrder = new Array()) {
        super();
        this.testQuestionId = testQuestionId;
        this.questionId = questionId;
        this.sequenceNumber = sequenceNumber;
        this.optionOrder = optionOrder;
    }
    static empty() {
        const item = new ShuffledQuestion();
        return item;
    }
    toString() {
        return `ShuffledQuestion{ testQuestionId: "${this.testQuestionId}", questionId: "${this.questionId}", sequenceNumber: ${this.sequenceNumber}, optionOrder: [${this.optionOrder.join(", ")}] }`;
    }
    equals(other) {
        if (this.testQuestionId !== other.testQuestionId ||
            this.questionId !== other.questionId ||
            this.sequenceNumber !== other.sequenceNumber) {
            return false;
        }
        if (this.optionOrder.length !== other.optionOrder.length) {
            return false;
        }
        for (let i = 0; i < this.optionOrder.length; i++) {
            if (this.optionOrder[i] !== other.optionOrder[i]) {
                return false;
            }
        }
        return true;
    }
    isEmpty() {
        return (this.testQuestionId === "" &&
            this.questionId === "" &&
            this.sequenceNumber === 0 &&
            this.optionOrder.length === 0);
    }
}
exports.ShuffledQuestion = ShuffledQuestion;
class TestSessionState extends BaseObject_1.BaseObject {
    sessionId = "";
    userId = "";
    testId = "";
    status = "IN_PROGRESS";
    currentQuestionIndex = 0;
    timeSpentSeconds = 0;
    remainingSeconds = 0;
    questions = new BaseObject_1.List();
    constructor() {
        super();
        // All primitives initialized to default minimums: 0, "", false
    }
    static empty() {
        const session = new TestSessionState();
        return session;
    }
    static nullObject() {
        const session = new TestSessionState();
        session.setNull(true);
        return session;
    }
    toString() {
        return `TestSessionState{ sessionId: "${this.sessionId}", userId: "${this.userId}", testId: "${this.testId}", status: "${this.status}", currentQuestionIndex: ${this.currentQuestionIndex}, timeSpentSeconds: ${this.timeSpentSeconds}, remainingSeconds: ${this.remainingSeconds}, questions: ${this.questions.toString()} }`;
    }
    equals(other) {
        return (this.sessionId === other.sessionId &&
            this.userId === other.userId &&
            this.testId === other.testId &&
            this.status === other.status &&
            this.currentQuestionIndex === other.currentQuestionIndex &&
            this.timeSpentSeconds === other.timeSpentSeconds &&
            this.remainingSeconds === other.remainingSeconds &&
            this.questions.equals(other.questions));
    }
    isEmpty() {
        return (this.sessionId === "" &&
            this.userId === "" &&
            this.testId === "" &&
            this.currentQuestionIndex === 0 &&
            this.timeSpentSeconds === 0 &&
            this.remainingSeconds === 0 &&
            this.questions.isEmpty());
    }
}
exports.TestSessionState = TestSessionState;
