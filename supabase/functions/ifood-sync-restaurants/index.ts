import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  withMiddleware,
  AuthContext,
  requireIfoodAccountAccess,
} from "../_shared/middleware.ts";
import { jsonResponse, ValidationError, NotFoundError } from "../_shared/errors.ts";
import { logAudit, getClientIp } from "../_shared/audit.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { listRestaurants } from "../_shared/ifood-client.ts";

/**
 * POST /ifood-sync-restaurants
 *
 * Synchronizes restaurants from the iFood API for a given iFood account.
 * Upserts the restaurants table, matching by ifood_restaurant_id.
 *
 * Body: { ifood_account_id: string }
 * Requires: authenticated + access to the iFood account
 */
const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;

    // Parse and validate input
    const body = await req.json();
    const { ifood_account_id } = body;

    if (!ifood_account_id || typeof ifood_account_id !== "string") {
      throw new ValidationError("ifood_account_id is required");
    }

    // Check access
    await requireIfoodAccountAccess(adminClient, userId, ifood_account_id);

    // Rate limit: max 5 syncs per minute
    await checkRateLimit(adminClient, userId, getClientIp(req), {
      functionName: "ifood-sync-restaurants",
      maxRequests: 5,
      windowSeconds: 60,
    });

    // Fetch the account
    const { data: account, error: fetchError } = await adminClient
      .from("ifood_accounts")
      .select("id, merchant_id, access_token, token_expires_at")
      .eq("id", ifood_account_id)
      .maybeSingle();

    if (fetchError || !account) {
      throw new NotFoundError("iFood account", ifood_account_id);
    }

    if (!account.access_token) {
      throw new ValidationError("No access token available. Please refresh the token first.");
    }

    // Fetch restaurants from iFood API
    const ifoodRestaurants = await listRestaurants(
      account.access_token,
      account.merchant_id,
    );

    // Upsert each restaurant
    const syncedRestaurants: Array<{
      id: string;
      name: string;
      ifood_restaurant_id: string;
    }> = [];

    for (const ifoodRestaurant of ifoodRestaurants) {
      const { data: restaurant, error: upsertError } = await adminClient
        .from("restaurants")
        .upsert(
          {
            ifood_account_id,
            ifood_restaurant_id: ifoodRestaurant.id,
            name: ifoodRestaurant.name,
            address: ifoodRestaurant.address ?? null,
            is_active: true,
          },
          {
            onConflict: "ifood_account_id,ifood_restaurant_id",
          },
        )
        .select("id, name, ifood_restaurant_id")
        .single();

      if (upsertError) {
        console.error(
          `Failed to upsert restaurant ${ifoodRestaurant.id}:`,
          upsertError.message,
        );
        continue;
      }

      if (restaurant) {
        syncedRestaurants.push(restaurant);
      }
    }

    // Update last_sync_at on the account
    await adminClient
      .from("ifood_accounts")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", ifood_account_id);

    // Audit log
    await logAudit(adminClient, {
      userId,
      action: "sync_restaurants",
      entity: "ifood_accounts",
      entityId: ifood_account_id,
      newData: {
        restaurants_synced: syncedRestaurants.length,
        restaurant_ids: syncedRestaurants.map((r) => r.id),
      },
      ipAddress: getClientIp(req),
    });

    return jsonResponse({
      success: true,
      synced_count: syncedRestaurants.length,
      restaurants: syncedRestaurants,
    });
  },
);

serve(handler);
