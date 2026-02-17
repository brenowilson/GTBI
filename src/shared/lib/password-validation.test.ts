import { describe, it, expect } from "vitest";
import { validatePassword } from "./password-validation";

describe("validatePassword", () => {
  it("rejects password shorter than 8 characters", () => {
    const result = validatePassword("Ab1");
    expect(result.isValid).toBe(false);
    expect(result.checks.minLength).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = validatePassword("abcdefgh1");
    expect(result.isValid).toBe(false);
    expect(result.checks.hasUppercase).toBe(false);
  });

  it("rejects password without number", () => {
    const result = validatePassword("Abcdefgh");
    expect(result.isValid).toBe(false);
    expect(result.checks.hasNumber).toBe(false);
  });

  it("accepts valid password (8+ chars, uppercase, number)", () => {
    const result = validatePassword("Abcdefg1");
    expect(result.isValid).toBe(true);
    expect(result.checks.minLength).toBe(true);
    expect(result.checks.hasUppercase).toBe(true);
    expect(result.checks.hasNumber).toBe(true);
  });

  it("scores higher with special characters", () => {
    const withoutSpecial = validatePassword("Abcdefg1");
    const withSpecial = validatePassword("Abcdefg1!");
    expect(withSpecial.score).toBeGreaterThan(withoutSpecial.score);
    expect(withSpecial.checks.hasSpecial).toBe(true);
  });

  it("returns score 0 for empty password", () => {
    const result = validatePassword("");
    expect(result.score).toBe(0);
    expect(result.isValid).toBe(false);
  });
});
