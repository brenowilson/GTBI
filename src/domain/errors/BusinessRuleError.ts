export class BusinessRuleError extends Error {
  public readonly rule: string;

  constructor(rule: string, message?: string) {
    super(message ?? rule);
    this.name = "BusinessRuleError";
    this.rule = rule;
  }
}
