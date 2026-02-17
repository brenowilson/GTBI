import { describe, it, expect } from "vitest";
import { ActionRules } from "./rules";
import type { Action } from "./model";

const makeAction = (status: Action["status"]): Action => ({
  id: "1",
  report_id: null,
  restaurant_id: "r1",
  week_start: "2026-02-10",
  title: "Test action",
  description: null,
  goal: null,
  action_type: "operational",
  payload: null,
  target: null,
  status,
  done_evidence: null,
  done_by: null,
  done_at: null,
  discarded_reason: null,
  discarded_by: null,
  discarded_at: null,
  created_by: "u1",
  created_at: "2026-02-17T00:00:00Z",
  updated_at: "2026-02-17T00:00:00Z",
});

describe("ActionRules", () => {
  it("allows marking planned as done", () => {
    expect(ActionRules.canMarkDone(makeAction("planned"))).toBe(true);
  });

  it("disallows marking done as done again", () => {
    expect(ActionRules.canMarkDone(makeAction("done"))).toBe(false);
  });

  it("allows discarding planned", () => {
    expect(ActionRules.canDiscard(makeAction("planned"))).toBe(true);
  });

  it("disallows discarding done", () => {
    expect(ActionRules.canDiscard(makeAction("done"))).toBe(false);
  });

  it("validates transitions from planned", () => {
    expect(ActionRules.canTransitionTo(makeAction("planned"), "done")).toBe(true);
    expect(ActionRules.canTransitionTo(makeAction("planned"), "discarded")).toBe(true);
  });

  it("disallows transitions from terminal states", () => {
    expect(ActionRules.canTransitionTo(makeAction("done"), "planned")).toBe(false);
    expect(ActionRules.canTransitionTo(makeAction("discarded"), "planned")).toBe(false);
  });
});
