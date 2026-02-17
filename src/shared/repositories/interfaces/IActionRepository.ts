import type { Action, ActionStatus, ActionType, CreateActionInput } from "@/entities/action";

export interface ActionFilters {
  status?: ActionStatus;
  actionType?: ActionType;
  weekStart?: string;
  reportId?: string;
}

export interface IActionRepository {
  getByRestaurant(restaurantId: string, filters?: ActionFilters): Promise<Action[]>;
  getById(id: string): Promise<Action | null>;
  create(data: CreateActionInput): Promise<Action>;
  markDone(id: string, evidence: string): Promise<Action>;
  markDiscarded(id: string, reason: string): Promise<Action>;
}
