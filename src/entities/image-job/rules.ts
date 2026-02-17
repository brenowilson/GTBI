import type { ImageJob, ImageJobStatus } from "./model";

const VALID_TRANSITIONS: Record<ImageJobStatus, ImageJobStatus[]> = {
  generating: ["ready_for_approval", "failed"],
  ready_for_approval: ["approved", "rejected"],
  approved: ["applied_to_catalog", "failed"],
  applied_to_catalog: ["archived"],
  rejected: ["archived"],
  archived: [],
  failed: ["generating"],
};

export const ImageJobRules = {
  canTransitionTo(job: ImageJob, newStatus: ImageJobStatus): boolean {
    const allowed = VALID_TRANSITIONS[job.status];
    return allowed?.includes(newStatus) ?? false;
  },

  canApprove(job: ImageJob): boolean {
    return job.status === "ready_for_approval";
  },

  canReject(job: ImageJob): boolean {
    return job.status === "ready_for_approval";
  },

  canRetry(job: ImageJob): boolean {
    return job.status === "failed" && job.retry_count < 3;
  },

  canApplyToCatalog(job: ImageJob): boolean {
    return job.status === "approved";
  },

  isAsync(mode: string): boolean {
    return mode === "improve_existing" || mode === "from_description";
  },
};
