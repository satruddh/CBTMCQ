import { BaseObject } from "./BaseObject";

export class ApiResponse<T> extends BaseObject<ApiResponse<T>> {
  public success: boolean = false;
  public message: string = "";
  public data: T | null = null;
  public error: string = "";

  constructor(
    success: boolean = false,
    message: string = "",
    data: T | null = null,
    error: string = ""
  ) {
    super();
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
  }

  public static success<T>(message: string, data: T): ApiResponse<T> {
    const res: ApiResponse<T> = new ApiResponse<T>(true, message, data, "");
    return res;
  }

  public static error<T>(message: string, error: string = ""): ApiResponse<T> {
    const res: ApiResponse<T> = new ApiResponse<T>(false, message, null, error);
    return res;
  }

  public override toString(): string {
    return `ApiResponse{ success: ${this.success}, message: "${this.message}", error: "${this.error}" }`;
  }

  public override equals(other: ApiResponse<T>): boolean {
    return (
      this.success === other.success && this.message === other.message && this.error === other.error
    );
  }

  public override isEmpty(): boolean {
    return !this.success && this.message === "" && this.data === null && this.error === "";
  }
}
