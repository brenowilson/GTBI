import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  withMiddleware,
  AuthContext,
  requireRestaurantAccess,
} from "../_shared/middleware.ts";
import { jsonResponse, ValidationError, NotFoundError } from "../_shared/errors.ts";
import { logAudit, getClientIp } from "../_shared/audit.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import {
  getPerformanceMetrics,
  getOrders,
  getReviews,
  getTickets,
  getFinancialEntries,
} from "../_shared/ifood-client.ts";

/**
 * POST /ifood-collect-data
 *
 * Collects performance data from the iFood API for a restaurant.
 * Stores snapshots, reviews, orders, tickets, and financial entries.
 *
 * Body: {
 *   restaurant_id: string,
 *   week_start: string (YYYY-MM-DD),
 *   week_end: string (YYYY-MM-DD)
 * }
 * Requires: authenticated + access to the restaurant
 */
const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;

    // Parse and validate input
    const body = await req.json();
    const { restaurant_id, week_start, week_end } = body;

    if (!restaurant_id || typeof restaurant_id !== "string") {
      throw new ValidationError("restaurant_id is required");
    }

    if (!week_start || typeof week_start !== "string") {
      throw new ValidationError("week_start is required (YYYY-MM-DD)");
    }

    if (!week_end || typeof week_end !== "string") {
      throw new ValidationError("week_end is required (YYYY-MM-DD)");
    }

    // Check access
    await requireRestaurantAccess(adminClient, userId, restaurant_id);

    // Rate limit: max 3 collections per minute per user
    await checkRateLimit(adminClient, userId, getClientIp(req), {
      functionName: "ifood-collect-data",
      maxRequests: 3,
      windowSeconds: 60,
    });

    // Fetch restaurant with its iFood account
    const { data: restaurant, error: restError } = await adminClient
      .from("restaurants")
      .select("id, ifood_restaurant_id, ifood_account_id")
      .eq("id", restaurant_id)
      .maybeSingle();

    if (restError || !restaurant) {
      throw new NotFoundError("Restaurant", restaurant_id);
    }

    // Fetch the iFood account for access token
    const { data: account, error: accError } = await adminClient
      .from("ifood_accounts")
      .select("id, access_token")
      .eq("id", restaurant.ifood_account_id)
      .maybeSingle();

    if (accError || !account || !account.access_token) {
      throw new ValidationError("iFood account has no valid access token. Please refresh first.");
    }

    const accessToken = account.access_token;
    const ifoodRestaurantId = restaurant.ifood_restaurant_id;
    const startedAt = new Date().toISOString();

    const summary: Record<string, { status: string; count: number; error?: string }> = {};

    // 1. Collect performance metrics -> restaurant_snapshots
    try {
      const metrics = await getPerformanceMetrics(
        accessToken,
        ifoodRestaurantId,
        week_start,
        week_end,
      );

      const { error: snapError } = await adminClient
        .from("restaurant_snapshots")
        .upsert(
          {
            restaurant_id,
            week_start,
            week_end,
            visits: metrics.visits,
            views: metrics.views,
            to_cart: metrics.toCart,
            checkout: metrics.checkout,
            completed: metrics.completed,
            cancellation_rate: metrics.cancellationRate,
            open_time_rate: metrics.openTimeRate,
            open_tickets_rate: metrics.openTicketsRate,
            new_customers_rate: metrics.newCustomersRate,
          },
          { onConflict: "restaurant_id,week_start" },
        );

      if (snapError) throw new Error(snapError.message);
      summary.snapshots = { status: "success", count: 1 };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Snapshot collection failed:", msg);
      summary.snapshots = { status: "failed", count: 0, error: msg };
    }

    // 2. Collect orders
    try {
      const orders = await getOrders(accessToken, ifoodRestaurantId, week_start, week_end);
      let insertedCount = 0;

      for (const order of orders) {
        const { error: orderError } = await adminClient
          .from("orders")
          .upsert(
            {
              restaurant_id,
              ifood_order_id: order.id,
              status: order.status,
              total: order.total,
              items_count: order.itemsCount,
              customer_name: order.customerName,
              order_date: order.orderDate,
            },
            { onConflict: "ifood_order_id" },
          );

        if (!orderError) insertedCount++;
      }

      summary.orders = { status: "success", count: insertedCount };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Orders collection failed:", msg);
      summary.orders = { status: "failed", count: 0, error: msg };
    }

    // 3. Collect reviews
    try {
      const reviews = await getReviews(accessToken, ifoodRestaurantId, week_start, week_end);
      let insertedCount = 0;

      for (const review of reviews) {
        const { error: reviewError } = await adminClient
          .from("reviews")
          .upsert(
            {
              restaurant_id,
              ifood_review_id: review.id,
              order_id: review.orderId,
              rating: review.rating,
              comment: review.comment,
              customer_name: review.customerName,
              review_date: review.reviewDate,
            },
            { onConflict: "ifood_review_id" },
          );

        if (!reviewError) insertedCount++;
      }

      summary.reviews = { status: "success", count: insertedCount };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Reviews collection failed:", msg);
      summary.reviews = { status: "failed", count: 0, error: msg };
    }

    // 4. Collect tickets
    try {
      const tickets = await getTickets(accessToken, ifoodRestaurantId);
      let insertedCount = 0;

      for (const ticket of tickets) {
        const { error: ticketError } = await adminClient
          .from("tickets")
          .upsert(
            {
              restaurant_id,
              ifood_ticket_id: ticket.id,
              order_id: ticket.orderId,
              subject: ticket.subject,
              status: ticket.status === "closed" ? "closed" : "open",
            },
            { onConflict: "ifood_ticket_id" },
          );

        if (!ticketError) insertedCount++;
      }

      summary.tickets = { status: "success", count: insertedCount };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Tickets collection failed:", msg);
      summary.tickets = { status: "failed", count: 0, error: msg };
    }

    // 5. Collect financial entries
    try {
      const entries = await getFinancialEntries(
        accessToken,
        ifoodRestaurantId,
        week_start,
        week_end,
      );
      let insertedCount = 0;

      for (const entry of entries) {
        // Map iFood entry types to our enum
        const validTypes = [
          "revenue", "fee", "promotion", "refund",
          "adjustment", "delivery_fee", "commission", "other",
        ];
        const entryType = validTypes.includes(entry.type) ? entry.type : "other";

        const { error: entryError } = await adminClient
          .from("financial_entries")
          .upsert(
            {
              restaurant_id,
              ifood_entry_id: entry.id,
              entry_type: entryType,
              description: entry.description,
              amount: entry.amount,
              reference_date: entry.referenceDate,
              order_id: entry.orderId ?? null,
            },
            { onConflict: "ifood_entry_id", ignoreDuplicates: true },
          );

        if (!entryError) insertedCount++;
      }

      summary.financial = { status: "success", count: insertedCount };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Financial collection failed:", msg);
      summary.financial = { status: "failed", count: 0, error: msg };
    }

    // Create data_collection_log
    const completedAt = new Date().toISOString();
    const totalCollected = Object.values(summary).reduce((sum, s) => sum + s.count, 0);
    const hasFailures = Object.values(summary).some((s) => s.status === "failed");

    await adminClient.from("data_collection_logs").insert({
      restaurant_id,
      collection_type: "full",
      status: hasFailures ? "failed" : "success",
      items_collected: totalCollected,
      error_message: hasFailures
        ? Object.entries(summary)
            .filter(([, s]) => s.status === "failed")
            .map(([key, s]) => `${key}: ${s.error}`)
            .join("; ")
        : null,
      started_at: startedAt,
      completed_at: completedAt,
    });

    // Audit log
    await logAudit(adminClient, {
      userId,
      action: "collect_data",
      entity: "restaurants",
      entityId: restaurant_id,
      newData: { week_start, week_end, summary },
      ipAddress: getClientIp(req),
    });

    return jsonResponse({
      success: true,
      restaurant_id,
      week_start,
      week_end,
      summary,
    });
  },
);

serve(handler);
