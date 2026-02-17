import { describe, it, expect } from "vitest";
import { restaurantSchema, restaurantSnapshotSchema } from "./model";

describe("restaurantSchema", () => {
  it("validates a valid restaurant", () => {
    const result = restaurantSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      ifood_account_id: "550e8400-e29b-41d4-a716-446655440001",
      ifood_restaurant_id: "abc123",
      name: "Restaurante Teste",
      address: null,
      is_active: true,
      review_auto_reply_enabled: false,
      review_auto_reply_mode: "template",
      review_reply_template: null,
      review_ai_prompt: null,
      ticket_auto_reply_enabled: false,
      ticket_auto_reply_mode: "template",
      ticket_reply_template: null,
      ticket_ai_prompt: null,
      created_at: "2026-02-17T00:00:00Z",
      updated_at: "2026-02-17T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid auto_reply_mode", () => {
    const result = restaurantSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      ifood_account_id: "550e8400-e29b-41d4-a716-446655440001",
      ifood_restaurant_id: "abc123",
      name: "Restaurante Teste",
      address: null,
      is_active: true,
      review_auto_reply_enabled: false,
      review_auto_reply_mode: "invalid",
      review_reply_template: null,
      review_ai_prompt: null,
      ticket_auto_reply_enabled: false,
      ticket_auto_reply_mode: "template",
      ticket_reply_template: null,
      ticket_ai_prompt: null,
      created_at: "2026-02-17T00:00:00Z",
      updated_at: "2026-02-17T00:00:00Z",
    });
    expect(result.success).toBe(false);
  });
});

describe("restaurantSnapshotSchema", () => {
  it("validates a valid snapshot", () => {
    const result = restaurantSnapshotSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      restaurant_id: "550e8400-e29b-41d4-a716-446655440001",
      week_start: "2026-02-10",
      week_end: "2026-02-16",
      visits: 1000,
      views: 800,
      to_cart: 400,
      checkout: 300,
      completed: 250,
      cancellation_rate: 0.015,
      open_time_rate: 0.96,
      open_tickets_rate: 0.02,
      new_customers_rate: 0.45,
      created_at: "2026-02-17T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative values", () => {
    const result = restaurantSnapshotSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      restaurant_id: "550e8400-e29b-41d4-a716-446655440001",
      week_start: "2026-02-10",
      week_end: "2026-02-16",
      visits: -1,
      views: 800,
      to_cart: 400,
      checkout: 300,
      completed: 250,
      cancellation_rate: 0.015,
      open_time_rate: 0.96,
      open_tickets_rate: 0.02,
      new_customers_rate: 0.45,
      created_at: "2026-02-17T00:00:00Z",
    });
    expect(result.success).toBe(false);
  });
});
