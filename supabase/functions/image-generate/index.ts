import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  withMiddleware,
  AuthContext,
  requireRestaurantAccess,
  checkIdempotency,
} from "../_shared/middleware.ts";
import { jsonResponse, ValidationError, NotFoundError } from "../_shared/errors.ts";
import { logAudit, getClientIp } from "../_shared/audit.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { generateImage, editImage } from "../_shared/openai.ts";

const VALID_MODES = [
  "improve_existing",
  "from_image",
  "from_description",
  "from_new_description",
  "direct_upload",
] as const;

type ImageMode = (typeof VALID_MODES)[number];

/**
 * POST /image-generate
 *
 * Generates or improves a catalog item image using OpenAI gpt-image-1.
 *
 * Body: {
 *   catalog_item_id: string,
 *   mode: "improve_existing" | "from_image" | "from_description" | "from_new_description" | "direct_upload",
 *   prompt?: string,
 *   source_image_url?: string,
 *   new_description?: string
 * }
 * Requires: user_can(userId, 'catalog', 'update') + restaurant access
 */
const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;

    // Idempotency check
    await checkIdempotency(adminClient, req);

    // Rate limit: max 10 image generations per minute
    await checkRateLimit(adminClient, userId, getClientIp(req), {
      functionName: "image-generate",
      maxRequests: 10,
      windowSeconds: 60,
    });

    // Parse and validate input
    const body = await req.json();
    const { catalog_item_id, mode, prompt, source_image_url, new_description } = body;

    if (!catalog_item_id || typeof catalog_item_id !== "string") {
      throw new ValidationError("catalog_item_id is required");
    }

    if (!mode || !VALID_MODES.includes(mode)) {
      throw new ValidationError(
        `mode is required. Must be one of: ${VALID_MODES.join(", ")}`,
      );
    }

    // Fetch the catalog item
    const { data: item, error: itemError } = await adminClient
      .from("catalog_items")
      .select("id, restaurant_id, name, description, image_url")
      .eq("id", catalog_item_id)
      .maybeSingle();

    if (itemError || !item) {
      throw new NotFoundError("Catalog item", catalog_item_id);
    }

    // Check restaurant access
    await requireRestaurantAccess(adminClient, userId, item.restaurant_id);

    // Validate mode-specific requirements
    if (mode === "improve_existing" && !item.image_url) {
      throw new ValidationError(
        "Cannot improve existing image: catalog item has no current image",
      );
    }

    if (mode === "from_image" && !source_image_url) {
      throw new ValidationError("source_image_url is required for 'from_image' mode");
    }

    if (mode === "from_new_description" && !new_description) {
      throw new ValidationError("new_description is required for 'from_new_description' mode");
    }

    // Create image_job record
    const { data: job, error: jobError } = await adminClient
      .from("image_jobs")
      .insert({
        catalog_item_id,
        restaurant_id: item.restaurant_id,
        mode,
        status: "generating",
        prompt: prompt ?? null,
        source_image_url: source_image_url ?? null,
        new_description: new_description ?? null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (jobError || !job) {
      throw new Error(`Failed to create image job: ${jobError?.message}`);
    }

    // Log initial status
    await adminClient.from("image_job_logs").insert({
      image_job_id: job.id,
      action: "job_created",
      performed_by: userId,
      details: { mode, catalog_item_id },
    });

    // Build the generation prompt based on mode
    let generatedImageUrl: string | null = null;
    let errorMessage: string | null = null;

    try {
      const imagePrompt = buildPrompt(
        mode as ImageMode,
        item.name,
        item.description,
        prompt,
        new_description,
      );

      let imageResult;

      if (mode === "improve_existing" || mode === "from_image") {
        // Edit existing image
        const sourceUrl =
          mode === "improve_existing" ? item.image_url! : source_image_url!;

        imageResult = await editImage({
          prompt: imagePrompt,
          sourceImageUrl: sourceUrl,
        });
      } else if (mode === "direct_upload") {
        // For direct_upload, we just store the source_image_url directly
        if (!source_image_url) {
          throw new ValidationError("source_image_url is required for direct_upload mode");
        }

        // Update job directly with the uploaded URL
        await adminClient
          .from("image_jobs")
          .update({
            generated_image_url: source_image_url,
            status: "ready_for_approval",
          })
          .eq("id", job.id);

        await adminClient.from("image_job_logs").insert({
          image_job_id: job.id,
          action: "status_change",
          performed_by: userId,
          details: { from: "generating", to: "ready_for_approval", mode: "direct_upload" },
        });

        return jsonResponse({
          success: true,
          job: {
            id: job.id,
            catalog_item_id,
            mode,
            status: "ready_for_approval",
            generated_image_url: source_image_url,
          },
        }, 201);
      } else {
        // Generate new image from prompt
        imageResult = await generateImage({
          prompt: imagePrompt,
          size: "1024x1024",
          quality: "high",
        });
      }

      // Upload generated image to Supabase Storage
      const imageBuffer = Uint8Array.from(
        atob(imageResult.b64Json),
        (c) => c.charCodeAt(0),
      );

      const fileName = `image-jobs/${job.id}.png`;
      const { error: uploadError } = await adminClient.storage
        .from("catalog-images")
        .upload(fileName, imageBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error("Failed to upload generated image:", uploadError.message);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = adminClient.storage
        .from("catalog-images")
        .getPublicUrl(fileName);

      generatedImageUrl = urlData?.publicUrl ?? null;

      // Update job status
      await adminClient
        .from("image_jobs")
        .update({
          generated_image_url: generatedImageUrl,
          status: "ready_for_approval",
        })
        .eq("id", job.id);

      // Log status change
      await adminClient.from("image_job_logs").insert({
        image_job_id: job.id,
        action: "status_change",
        performed_by: userId,
        details: { from: "generating", to: "ready_for_approval" },
      });
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Image generation failed:", errorMessage);

      // Update job as failed
      await adminClient
        .from("image_jobs")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", job.id);

      // Log failure
      await adminClient.from("image_job_logs").insert({
        image_job_id: job.id,
        action: "status_change",
        performed_by: userId,
        details: { from: "generating", to: "failed", error: errorMessage },
      });
    }

    // Audit log
    await logAudit(adminClient, {
      userId,
      action: "generate_image",
      entity: "image_jobs",
      entityId: job.id,
      newData: {
        catalog_item_id,
        mode,
        status: errorMessage ? "failed" : "ready_for_approval",
      },
      ipAddress: getClientIp(req),
    });

    if (errorMessage) {
      return jsonResponse({
        success: false,
        job: {
          id: job.id,
          catalog_item_id,
          mode,
          status: "failed",
          error: errorMessage,
        },
      });
    }

    return jsonResponse({
      success: true,
      job: {
        id: job.id,
        catalog_item_id,
        mode,
        status: "ready_for_approval",
        generated_image_url: generatedImageUrl,
      },
    }, 201);
  },
  { permission: ["catalog", "update"] },
);

function buildPrompt(
  mode: ImageMode,
  itemName: string,
  itemDescription: string | null,
  customPrompt: string | undefined,
  newDescription: string | undefined,
): string {
  const baseContext = `Professional food photography of "${itemName}"${
    itemDescription ? `: ${itemDescription}` : ""
  }. High quality, appetizing, well-lit, restaurant menu style.`;

  switch (mode) {
    case "improve_existing":
      return customPrompt ??
        `Improve this food photo: make it more appetizing, better lighting, professional quality. ${baseContext}`;

    case "from_image":
      return customPrompt ??
        `Create a professional food photo based on this reference image. ${baseContext}`;

    case "from_description":
      return customPrompt ?? baseContext;

    case "from_new_description":
      return `Professional food photography: ${newDescription}. High quality, appetizing, well-lit, restaurant menu style.`;

    default:
      return customPrompt ?? baseContext;
  }
}

serve(handler);
