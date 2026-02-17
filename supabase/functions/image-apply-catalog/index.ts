import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  withMiddleware,
  AuthContext,
  requirePermission,
  requireRestaurantAccess,
  checkIdempotency,
} from "../_shared/middleware.ts";
import { jsonResponse, ValidationError, NotFoundError } from "../_shared/errors.ts";
import { logAudit, getClientIp } from "../_shared/audit.ts";

/**
 * POST /image-apply-catalog
 *
 * Applies an approved image job to its catalog item,
 * updating the item's image_url with the generated image.
 *
 * Body: { image_job_id: string }
 * Requires: user_can(userId, 'catalog', 'update') + restaurant access
 */
const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;

    // Permission check
    await requirePermission(adminClient, userId, "catalog", "update");

    // Idempotency check
    await checkIdempotency(adminClient, req);

    // Parse and validate input
    const body = await req.json();
    const { image_job_id } = body;

    if (!image_job_id || typeof image_job_id !== "string") {
      throw new ValidationError("image_job_id is required");
    }

    // Fetch the image job
    const { data: job, error: jobError } = await adminClient
      .from("image_jobs")
      .select(
        "id, catalog_item_id, restaurant_id, status, generated_image_url, new_description",
      )
      .eq("id", image_job_id)
      .maybeSingle();

    if (jobError || !job) {
      throw new NotFoundError("Image job", image_job_id);
    }

    // Validate job status
    if (job.status !== "approved") {
      throw new ValidationError(
        `Image job must be in 'approved' status to apply. Current status: '${job.status}'`,
      );
    }

    if (!job.generated_image_url) {
      throw new ValidationError("Image job has no generated image URL");
    }

    if (!job.catalog_item_id) {
      throw new ValidationError("Image job has no associated catalog item");
    }

    // Check restaurant access
    await requireRestaurantAccess(adminClient, userId, job.restaurant_id);

    // Fetch current catalog item for audit old_data
    const { data: currentItem } = await adminClient
      .from("catalog_items")
      .select("id, name, image_url, description")
      .eq("id", job.catalog_item_id)
      .maybeSingle();

    if (!currentItem) {
      throw new NotFoundError("Catalog item", job.catalog_item_id);
    }

    // Update catalog item image_url
    const updateData: Record<string, unknown> = {
      image_url: job.generated_image_url,
    };

    // If the job includes a new description, update that too
    if (job.new_description) {
      updateData.description = job.new_description;
    }

    const { error: updateError } = await adminClient
      .from("catalog_items")
      .update(updateData)
      .eq("id", job.catalog_item_id);

    if (updateError) {
      throw new Error(`Failed to update catalog item: ${updateError.message}`);
    }

    // Update image job status to 'applied_to_catalog'
    const appliedAt = new Date().toISOString();
    const { error: jobUpdateError } = await adminClient
      .from("image_jobs")
      .update({
        status: "applied_to_catalog",
        applied_at: appliedAt,
      })
      .eq("id", image_job_id);

    if (jobUpdateError) {
      console.error("Failed to update image job status:", jobUpdateError.message);
    }

    // Create image job log
    await adminClient.from("image_job_logs").insert({
      image_job_id,
      action: "applied_to_catalog",
      performed_by: userId,
      details: {
        catalog_item_id: job.catalog_item_id,
        old_image_url: currentItem.image_url,
        new_image_url: job.generated_image_url,
      },
    });

    // Audit log
    await logAudit(adminClient, {
      userId,
      action: "apply_image_to_catalog",
      entity: "catalog_items",
      entityId: job.catalog_item_id,
      oldData: {
        image_url: currentItem.image_url,
        description: currentItem.description,
      },
      newData: {
        image_url: job.generated_image_url,
        description: job.new_description ?? currentItem.description,
      },
      ipAddress: getClientIp(req),
    });

    return jsonResponse({
      success: true,
      catalog_item: {
        id: job.catalog_item_id,
        name: currentItem.name,
        image_url: job.generated_image_url,
        description: job.new_description ?? currentItem.description,
      },
      image_job: {
        id: image_job_id,
        status: "applied_to_catalog",
        applied_at: appliedAt,
      },
    });
  },
);

serve(handler);
