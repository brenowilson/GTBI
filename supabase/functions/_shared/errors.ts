import { corsHeaders } from "./cors.ts";

/**
 * Application-level error types for consistent API responses.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(403, message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    const msg = id ? `${entity} with id '${id}' not found` : `${entity} not found`;
    super(404, msg, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded. Please try again later.") {
    super(429, message, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(502, `${service}: ${message}`, "EXTERNAL_SERVICE_ERROR");
    this.name = "ExternalServiceError";
  }
}

/**
 * Builds a JSON error response with CORS headers.
 */
export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
        },
      }),
      {
        status: error.statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Unknown error — log it and return generic 500
  console.error("Unhandled error:", error);
  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    }),
    {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

/**
 * Builds a JSON success response with CORS headers.
 */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
