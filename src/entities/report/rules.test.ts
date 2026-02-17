import { describe, it, expect } from "vitest";
import { ReportRules } from "./rules";
import type { Report } from "./model";

const makeReport = (status: Report["status"]): Report => ({
  id: "1",
  restaurant_id: "r1",
  week_start: "2026-02-10",
  week_end: "2026-02-16",
  status,
  pdf_url: null,
  pdf_hash: null,
  generated_at: "2026-02-17T06:00:00Z",
  created_at: "2026-02-17T06:00:00Z",
  updated_at: "2026-02-17T06:00:00Z",
});

describe("ReportRules", () => {
  it("allows transition from generated to sending", () => {
    expect(ReportRules.canTransitionTo(makeReport("generated"), "sending")).toBe(true);
  });

  it("disallows transition from generated to sent", () => {
    expect(ReportRules.canTransitionTo(makeReport("generated"), "sent")).toBe(false);
  });

  it("allows retry from failed", () => {
    expect(ReportRules.canRetry(makeReport("failed"))).toBe(true);
  });

  it("disallows retry from sent", () => {
    expect(ReportRules.canRetry(makeReport("sent"))).toBe(false);
  });

  it("can send from generated", () => {
    expect(ReportRules.canSend(makeReport("generated"))).toBe(true);
  });

  it("can send from failed (retry)", () => {
    expect(ReportRules.canSend(makeReport("failed"))).toBe(true);
  });

  it("cannot send from sending", () => {
    expect(ReportRules.canSend(makeReport("sending"))).toBe(false);
  });
});
