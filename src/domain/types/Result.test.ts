import { describe, it, expect } from "vitest";
import { Result } from "./Result";

describe("Result", () => {
  it("creates a success result", () => {
    const result = Result.ok("data");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("data");
    }
  });

  it("creates a failure result", () => {
    const error = new Error("Something went wrong");
    const result = Result.fail(error);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Something went wrong");
    }
  });

  it("narrows type correctly on success", () => {
    const result = Result.ok({ id: "123", name: "Test" });
    if (result.success) {
      expect(result.data.id).toBe("123");
      expect(result.data.name).toBe("Test");
    }
  });

  it("narrows type correctly on failure", () => {
    const error = new TypeError("Type error");
    const result = Result.fail(error);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(TypeError);
    }
  });
});
