import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ExternalServiceError } from "./errors.ts";

const OPENAI_API_URL = "https://api.openai.com/v1";

function getApiKey(): string {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) {
    throw new ExternalServiceError("OpenAI", "OPENAI_API_KEY not configured");
  }
  return key;
}

// ============================================
// Chat Completion
// ============================================

export interface ChatCompletionOptions {
  model?: string;
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResult {
  content: string;
  usage: TokenUsage | null;
}

/**
 * Sends a chat completion request to OpenAI and returns content + usage data.
 * Default model: gpt-4o
 */
export async function chatCompletionWithUsage(
  options: ChatCompletionOptions,
): Promise<ChatCompletionResult> {
  const apiKey = getApiKey();
  const model = options.model ?? "gpt-4o";

  const messages: Array<{ role: string; content: string }> = [];

  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: options.userPrompt });

  const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError(
      "OpenAI",
      `Chat completion failed (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  const usage: TokenUsage | null = data.usage
    ? {
        prompt_tokens: data.usage.prompt_tokens ?? 0,
        completion_tokens: data.usage.completion_tokens ?? 0,
        total_tokens: data.usage.total_tokens ?? 0,
      }
    : null;

  return { content, usage };
}

/**
 * Sends a chat completion request to OpenAI.
 * Default model: gpt-4o
 *
 * Backward-compatible wrapper — returns only the content string.
 */
export async function chatCompletion(
  options: ChatCompletionOptions,
): Promise<string> {
  const result = await chatCompletionWithUsage(options);
  return result.content;
}

// ============================================
// API Usage Tracking
// ============================================

const COST_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
};

const DEFAULT_COST_PER_1K = { input: 0.003, output: 0.015 };

/**
 * Estimates the cost in USD based on model and token counts.
 */
export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const rates = COST_PER_1K_TOKENS[model] ?? DEFAULT_COST_PER_1K;
  return (promptTokens / 1000) * rates.input +
    (completionTokens / 1000) * rates.output;
}

export interface ApiUsageEntry {
  userId?: string;
  edgeFunction: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  metadata?: Record<string, unknown>;
}

/**
 * Logs an API usage entry to the api_usage_logs table.
 * Non-throwing — logs error to console but does not break the main flow.
 * Same pattern as logAudit in _shared/audit.ts.
 */
export async function logApiUsage(
  adminClient: SupabaseClient,
  entry: ApiUsageEntry,
): Promise<void> {
  const { error } = await adminClient.from("api_usage_logs").insert({
    user_id: entry.userId ?? null,
    edge_function: entry.edgeFunction,
    model: entry.model,
    prompt_tokens: entry.promptTokens,
    completion_tokens: entry.completionTokens,
    total_tokens: entry.totalTokens,
    estimated_cost: entry.estimatedCost,
    metadata: entry.metadata ?? null,
  });

  if (error) {
    console.error("Failed to log API usage:", error.message);
  }
}

// ============================================
// Image Generation
// ============================================

export interface ImageGenerationOptions {
  prompt: string;
  /** Model to use. Default: gpt-image-1 */
  model?: string;
  /** Image size. Default: 1024x1024 */
  size?: "1024x1024" | "1536x1024" | "1024x1536" | "auto";
  /** Quality setting. Default: auto */
  quality?: "low" | "medium" | "high" | "auto";
  /** Number of images to generate. Default: 1 */
  n?: number;
}

export interface GeneratedImage {
  /** Base64-encoded image data */
  b64Json: string;
}

/**
 * Generates an image using OpenAI gpt-image-1.
 * Returns base64-encoded image data.
 */
export async function generateImage(
  options: ImageGenerationOptions,
): Promise<GeneratedImage> {
  const apiKey = getApiKey();

  const response = await fetch(`${OPENAI_API_URL}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model ?? "gpt-image-1",
      prompt: options.prompt,
      size: options.size ?? "1024x1024",
      quality: options.quality ?? "auto",
      n: options.n ?? 1,
      output_format: "png",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError(
      "OpenAI Images",
      `Image generation failed (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();
  const imageData = data.data?.[0];

  if (!imageData?.b64_json) {
    throw new ExternalServiceError(
      "OpenAI Images",
      "No image data returned from API",
    );
  }

  return {
    b64Json: imageData.b64_json,
  };
}

export interface ImageEditOptions {
  prompt: string;
  /** URL or base64 of the source image to edit */
  sourceImageUrl: string;
  model?: string;
  size?: "1024x1024" | "1536x1024" | "1024x1536" | "auto";
  quality?: "low" | "medium" | "high" | "auto";
}

/**
 * Edits an existing image using OpenAI gpt-image-1.
 * Downloads the source image first, then sends it for editing.
 */
export async function editImage(
  options: ImageEditOptions,
): Promise<GeneratedImage> {
  const apiKey = getApiKey();

  // Download the source image
  const imageResponse = await fetch(options.sourceImageUrl);
  if (!imageResponse.ok) {
    throw new ExternalServiceError(
      "OpenAI Images",
      `Failed to download source image from ${options.sourceImageUrl}`,
    );
  }
  const imageBlob = await imageResponse.blob();

  // Build multipart form data
  const formData = new FormData();
  formData.append("model", options.model ?? "gpt-image-1");
  formData.append("prompt", options.prompt);
  formData.append("image[]", imageBlob, "source.png");
  formData.append("size", options.size ?? "1024x1024");

  const response = await fetch(`${OPENAI_API_URL}/images/edits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError(
      "OpenAI Images",
      `Image edit failed (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();
  const imageData = data.data?.[0];

  if (!imageData?.b64_json) {
    throw new ExternalServiceError(
      "OpenAI Images",
      "No image data returned from edit API",
    );
  }

  return {
    b64Json: imageData.b64_json,
  };
}
