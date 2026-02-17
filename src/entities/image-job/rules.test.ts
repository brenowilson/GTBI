import { describe, it, expect } from "vitest";
import { ImageJobRules } from "./rules";
import type { ImageJob } from "./model";

const makeJob = (status: ImageJob["status"], retryCount = 0): ImageJob => ({
  id: "1",
  catalog_item_id: "ci1",
  restaurant_id: "r1",
  mode: "improve_existing",
  status,
  prompt: null,
  source_image_url: null,
  generated_image_url: null,
  new_description: null,
  created_by: "u1",
  approved_by: null,
  approved_at: null,
  applied_at: null,
  error_message: null,
  retry_count: retryCount,
  created_at: "2026-02-17T00:00:00Z",
  updated_at: "2026-02-17T00:00:00Z",
});

describe("ImageJobRules", () => {
  it("allows approval when ready", () => {
    expect(ImageJobRules.canApprove(makeJob("ready_for_approval"))).toBe(true);
  });

  it("disallows approval when generating", () => {
    expect(ImageJobRules.canApprove(makeJob("generating"))).toBe(false);
  });

  it("allows retry when failed and under limit", () => {
    expect(ImageJobRules.canRetry(makeJob("failed", 2))).toBe(true);
  });

  it("disallows retry when at retry limit", () => {
    expect(ImageJobRules.canRetry(makeJob("failed", 3))).toBe(false);
  });

  it("identifies async modes correctly", () => {
    expect(ImageJobRules.isAsync("improve_existing")).toBe(true);
    expect(ImageJobRules.isAsync("from_description")).toBe(true);
    expect(ImageJobRules.isAsync("from_image")).toBe(false);
    expect(ImageJobRules.isAsync("direct_upload")).toBe(false);
  });

  it("can apply to catalog when approved", () => {
    expect(ImageJobRules.canApplyToCatalog(makeJob("approved"))).toBe(true);
  });

  it("cannot apply when not approved", () => {
    expect(ImageJobRules.canApplyToCatalog(makeJob("ready_for_approval"))).toBe(false);
  });
});
