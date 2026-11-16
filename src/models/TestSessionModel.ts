import { BaseObject, IBaseObject, List } from "../core/BaseObject";

export class ShuffledQuestion extends BaseObject<ShuffledQuestion> {
  public questionId: string = "";
  public sequenceNumber: number = 0;
  public optionOrder: Array<string> = new Array<string>();

  constructor(questionId: string = "", sequenceNumber: number = 0, optionOrder: Array<string> = new Array<string>()) {
    super();
    this.questionId = questionId;
    this.sequenceNumber = sequenceNumber;
    this.optionOrder = optionOrder;
  }

  public static empty(): ShuffledQuestion {
    const item: ShuffledQuestion = new ShuffledQuestion();
    return item;
  }

  public override toString(): string {
    return `ShuffledQuestion{ questionId: "${this.questionId}", sequenceNumber: ${this.sequenceNumber}, optionOrder: [${this.optionOrder.join(", ")}] }`;
  }

  public override equals(other: ShuffledQuestion): boolean {
    if (this.questionId !== other.questionId || this.sequenceNumber !== other.sequenceNumber) {
      return false;
    }
    if (this.optionOrder.length !== other.optionOrder.length) {
      return false;
    }
    for (let i: number = 0; i < this.optionOrder.length; i++) {
      if (this.optionOrder[i] !== other.optionOrder[i]) {
        return false;
      }
    }
    return true;
  }

  public override isEmpty(): boolean {
    return this.questionId === "" && this.sequenceNumber === 0 && this.optionOrder.length === 0;
  }
}

export class TestSessionState extends BaseObject<TestSessionState> {
  public sessionId: string = "";
  public userId: string = "";
  public testId: string = "";
  public status: string = "IN_PROGRESS";
  public currentQuestionIndex: number = 0;
  public timeSpentSeconds: number = 0;
  public remainingSeconds: number = 0;
  public questions: List<ShuffledQuestion> = new List<ShuffledQuestion>();

  constructor() {
    super();
    // All primitives initialized to default minimums: 0, "", false
  }

  public static empty(): TestSessionState {
    const session: TestSessionState = new TestSessionState();
    return session;
  }

  public static nullObject(): TestSessionState {
    const session: TestSessionState = new TestSessionState();
    session.setNull(true);
    return session;
  }

  public override toString(): string {
    return `TestSessionState{ sessionId: "${this.sessionId}", userId: "${this.userId}", testId: "${this.testId}", status: "${this.status}", currentQuestionIndex: ${this.currentQuestionIndex}, timeSpentSeconds: ${this.timeSpentSeconds}, remainingSeconds: ${this.remainingSeconds}, questions: ${this.questions.toString()} }`;
  }

  public override equals(other: TestSessionState): boolean {
    return (
      this.sessionId === other.sessionId &&
      this.userId === other.userId &&
      this.testId === other.testId &&
      this.status === other.status &&
      this.currentQuestionIndex === other.currentQuestionIndex &&
      this.timeSpentSeconds === other.timeSpentSeconds &&
      this.remainingSeconds === other.remainingSeconds &&
      this.questions.equals(other.questions)
    );
  }

  public override isEmpty(): boolean {
    return (
      this.sessionId === "" &&
      this.userId === "" &&
      this.testId === "" &&
      this.currentQuestionIndex === 0 &&
      this.timeSpentSeconds === 0 &&
      this.remainingSeconds === 0 &&
      this.questions.isEmpty()
    );
  }
}
