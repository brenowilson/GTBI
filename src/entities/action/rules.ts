import type { Action, ActionStatus } from "./model";

const VALID_TRANSITIONS: Record<ActionStatus, ActionStatus[]> = {
  planned: ["done", "discarded"],
  done: [],
  discarded: [],
};

export const ActionRules = {
  canTransitionTo(action: Action, newStatus: ActionStatus): boolean {
    const allowed = VALID_TRANSITIONS[action.status];
    return allowed?.includes(newStatus) ?? false;
  },

  canMarkDone(action: Action): boolean {
    return action.status === "planned";
  },

  canDiscard(action: Action): boolean {
    return action.status === "planned";
  },
};
