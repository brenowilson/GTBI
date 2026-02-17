import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { withMiddleware, AuthContext } from "../_shared/middleware.ts";
import { jsonResponse } from "../_shared/errors.ts";

/**
 * GET /admin-stats
 *
 * Returns administrative dashboard statistics: user counts, account counts,
 * restaurant counts, report counts.
 *
 * Requires: user_can(userId, 'users', 'read')
 */
const handler = withMiddleware(
  async (_req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { adminClient } = ctx!;

    // Fetch all stats in parallel
    const [
      totalUsersResult,
      activeUsersResult,
      totalIfoodAccountsResult,
      totalRestaurantsResult,
      totalReportsResult,
      reportsThisWeekResult,
    ] = await Promise.all([
      // Total users
      adminClient
        .from("user_profiles")
        .select("id", { count: "exact", head: true }),

      // Active users
      adminClient
        .from("user_profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),

      // Total iFood accounts
      adminClient
        .from("ifood_accounts")
        .select("id", { count: "exact", head: true }),

      // Total restaurants
      adminClient
        .from("restaurants")
        .select("id", { count: "exact", head: true }),

      // Total reports
      adminClient
        .from("reports")
        .select("id", { count: "exact", head: true }),

      // Reports this week (last 7 days)
      adminClient
        .from("reports")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // Fetch recent activity counts
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      recentReviewsResult,
      recentTicketsResult,
      recentImageJobsResult,
      pendingInvitationsResult,
    ] = await Promise.all([
      // Reviews in last 7 days
      adminClient
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo),

      // Open tickets
      adminClient
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]),

      // Image jobs in last 7 days
      adminClient
        .from("image_jobs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo),

      // Pending invitations
      adminClient
        .from("invitations")
        .select("id", { count: "exact", head: true })
        .is("accepted_at", null)
        .gte("expires_at", new Date().toISOString()),
    ]);

    return jsonResponse({
      success: true,
      stats: {
        total_users: totalUsersResult.count ?? 0,
        active_users: activeUsersResult.count ?? 0,
        total_ifood_accounts: totalIfoodAccountsResult.count ?? 0,
        total_restaurants: totalRestaurantsResult.count ?? 0,
        total_reports: totalReportsResult.count ?? 0,
        reports_this_week: reportsThisWeekResult.count ?? 0,
        recent_reviews: recentReviewsResult.count ?? 0,
        open_tickets: recentTicketsResult.count ?? 0,
        recent_image_jobs: recentImageJobsResult.count ?? 0,
        pending_invitations: pendingInvitationsResult.count ?? 0,
      },
      generated_at: new Date().toISOString(),
    });
  },
  {
    methods: ["GET"],
    permission: ["users", "read"],
  },
);

serve(handler);
