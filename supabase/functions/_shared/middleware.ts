import { SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";
import { getAdminClient, getUserClient } from "./supabase.ts";
import { handleCorsPreFlight, corsHeaders } from "./cors.ts";
import { UnauthorizedError, ForbiddenError, errorResponse, ConflictError } from "./errors.ts";
import { createLogger } from "./logger.ts";

export interface AuthContext {
  user: User;
  userId: string;
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
  authHeader: string;
}

/**
 * Extracts and verifies the authenticated user from the request.
 * Returns user object and pre-configured Supabase clients.
 *
 * @throws UnauthorizedError if no valid JWT is present
 */
export async function getAuthUser(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new UnauthorizedError("Missing Authorization header");
  }

  const adminClient = getAdminClient();
  const userClient = getUserClient(authHeader);

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  return {
    user,
    userId: user.id,
    adminClient,
    userClient,
    authHeader,
  };
}

/**
 * Checks if the user has the specified permission via the user_can() DB function.
 * Uses the admin client to call the function (bypasses RLS).
 *
 * @throws ForbiddenError if the user lacks the required permission
 */
export async function requirePermission(
  adminClient: SupabaseClient,
  userId: string,
  featureCode: string,
  action: string,
): Promise<void> {
  const { data, error } = await adminClient.rpc("user_can", {
    p_user_id: userId,
    p_feature_code: featureCode,
    p_action: action,
  });

  if (error) {
    console.error("Permission check error:", error.message);
    throw new ForbiddenError("Unable to verify permissions");
  }

  if (data !== true) {
    throw new ForbiddenError(
      `Permission denied: requires ${featureCode}:${action}`,
    );
  }
}

/**
 * Checks if the user has access to a specific restaurant via the
 * user_has_restaurant_access() DB function.
 *
 * @throws ForbiddenError if the user doesn't have access
 */
export async function requireRestaurantAccess(
  adminClient: SupabaseClient,
  userId: string,
  restaurantId: string,
): Promise<void> {
  const { data, error } = await adminClient.rpc("user_has_restaurant_access", {
    p_user_id: userId,
    p_restaurant_id: restaurantId,
  });

  if (error) {
    console.error("Restaurant access check error:", error.message);
    throw new ForbiddenError("Unable to verify restaurant access");
  }

  if (data !== true) {
    throw new ForbiddenError("You do not have access to this restaurant");
  }
}

/**
 * Checks if the user has access to an iFood account.
 */
export async function requireIfoodAccountAccess(
  adminClient: SupabaseClient,
  userId: string,
  ifoodAccountId: string,
): Promise<void> {
  const { data, error } = await adminClient
    .from("ifood_account_access")
    .select("id")
    .eq("user_id", userId)
    .eq("ifood_account_id", ifoodAccountId)
    .maybeSingle();

  if (error) {
    console.error("iFood account access check error:", error.message);
    throw new ForbiddenError("Unable to verify account access");
  }

  // Also check if user is admin
  if (!data) {
    const { data: isAdmin } = await adminClient.rpc("user_can", {
      p_user_id: userId,
      p_feature_code: "restaurants",
      p_action: "read",
    });

    if (!isAdmin) {
      throw new ForbiddenError("You do not have access to this iFood account");
    }
  }
}

/**
 * Idempotency check — prevents duplicate processing of the same request.
 * Checks for x-idempotency-key header and validates against idempotency_keys table.
 *
 * @returns true if the request is a duplicate (already processed)
 * @throws ConflictError if duplicate detected
 */
export async function checkIdempotency(
  adminClient: SupabaseClient,
  req: Request,
): Promise<void> {
  const idempotencyKey = req.headers.get("x-idempotency-key");
  if (!idempotencyKey) {
    return; // No idempotency key provided — proceed normally
  }

  // Check if key already exists
  const { data: existing } = await adminClient
    .from("idempotency_keys")
    .select("id")
    .eq("key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    throw new ConflictError("Request already processed (duplicate idempotency key)");
  }

  // Store the key
  await adminClient.from("idempotency_keys").insert({ key: idempotencyKey });
}

export interface HandlerOptions {
  /** If true, skip authentication (e.g., for public endpoints) */
  public?: boolean;
  /** Required permission [featureCode, action] */
  permission?: [string, string];
  /** Allowed HTTP methods (default: ["POST"]) */
  methods?: string[];
}

export type HandlerFn = (
  req: Request,
  ctx: AuthContext | null,
) => Promise<Response>;

/**
 * Wraps an Edge Function handler with:
 * - CORS preflight handling
 * - Method validation
 * - Authentication (unless public)
 * - Permission checks
 * - Error catching with consistent JSON responses
 */
export function withMiddleware(
  handler: HandlerFn,
  options: HandlerOptions = {},
): (req: Request) => Promise<Response> {
  const allowedMethods = options.methods ?? ["POST"];

  return async (req: Request): Promise<Response> => {
    // Extract function name from URL path for logging
    const url = new URL(req.url);
    const functionName = url.pathname.split("/").pop() ?? "unknown";
    const log = createLogger(functionName);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return handleCorsPreFlight();
    }

    // Validate HTTP method
    if (!allowedMethods.includes(req.method)) {
      log.warn(`Method ${req.method} not allowed`, { allowedMethods });
      return new Response(
        JSON.stringify({
          error: {
            code: "METHOD_NOT_ALLOWED",
            message: `Method ${req.method} not allowed. Use ${allowedMethods.join(", ")}`,
          },
        }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    try {
      let ctx: AuthContext | null = null;

      if (!options.public) {
        log.info("Authenticating user");
        ctx = await getAuthUser(req);
        log.info("User authenticated", { userId: ctx.userId });

        if (options.permission) {
          log.info("Checking permission", {
            userId: ctx.userId,
            feature: options.permission[0],
            action: options.permission[1],
          });
          await requirePermission(
            ctx.adminClient,
            ctx.userId,
            options.permission[0],
            options.permission[1],
          );
          log.info("Permission granted", {
            userId: ctx.userId,
            feature: options.permission[0],
            action: options.permission[1],
          });
        }
      } else {
        log.info("Public endpoint — skipping auth");
      }

      log.request(req.method, ctx?.userId);
      const response = await handler(req, ctx);
      log.response(response.status, ctx?.userId);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorName = error instanceof Error ? error.constructor.name : "Error";
      log.error(`${errorName}: ${errorMessage}`, {
        errorType: errorName,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return errorResponse(error);
    }
  };
}
