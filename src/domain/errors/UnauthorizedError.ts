export class UnauthorizedError extends Error {
  public readonly action?: string;

  constructor(message?: string, action?: string) {
    super(message ?? "Unauthorized");
    this.name = "UnauthorizedError";
    this.action = action;
  }
}
