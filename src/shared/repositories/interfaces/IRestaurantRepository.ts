import type { Restaurant, RestaurantSnapshot, AutoReplyMode } from "@/entities/restaurant";

export interface RestaurantFilters {
  ifoodAccountId?: string;
  isActive?: boolean;
  search?: string;
}

export interface RestaurantSettingsUpdate {
  review_auto_reply_enabled?: boolean;
  review_auto_reply_mode?: AutoReplyMode;
  review_reply_template?: string | null;
  review_ai_prompt?: string | null;
  ticket_auto_reply_enabled?: boolean;
  ticket_auto_reply_mode?: AutoReplyMode;
  ticket_reply_template?: string | null;
  ticket_ai_prompt?: string | null;
}

export interface IRestaurantRepository {
  getAll(filters?: RestaurantFilters): Promise<Restaurant[]>;
  getById(id: string): Promise<Restaurant | null>;
  updateSettings(id: string, data: RestaurantSettingsUpdate): Promise<Restaurant>;
  getSnapshots(restaurantId: string, filters?: { weekStart?: string; weekEnd?: string }): Promise<RestaurantSnapshot[]>;
  getLatestSnapshot(restaurantId: string): Promise<RestaurantSnapshot | null>;
}
