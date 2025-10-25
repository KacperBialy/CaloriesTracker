import type { APIRoute } from "astro";
import { z } from "zod";
import {
  OpenRouterService,
  ConfigurationError,
  ApiError,
  NetworkError,
  ResponseParsingError,
} from "@/lib/services/OpenRouterService";

/**
 * Zod schema for meal extraction response
 * Defines the structure of the LLM's JSON response
 */
const MealExtractionSchema = z.object({
  mealName: z.string().describe("The name of the meal, e.g., 'Scrambled eggs and toast'"),
  estimatedCalories: z.number().describe("The estimated total calories for the meal (0-9999)"),
  components: z
    .array(
      z.object({
        ingredient: z.string().describe("Name of the ingredient"),
        quantity: z.string().describe("Quantity with unit, e.g., '200g', '1 cup'"),
        estimatedCalories: z.number().describe("Calories for this ingredient"),
      })
    )
    .describe("List of meal components"),
});

type MealExtraction = z.infer<typeof MealExtractionSchema>;

/**
 * Input validation schema
 */
const ExtractMealRequestSchema = z.object({
  text: z.string().min(1, "Meal description cannot be empty").max(500, "Meal description too long"),
});

/**
 * POST /api/extract-meal
 *
 * Extract meal information from free-text input using OpenRouter LLM.
 * Returns structured meal data with calorie estimates.
 *
 * Request body:
 * ```json
 * { "text": "Two scrambled eggs with whole wheat toast and butter" }
 * ```
 *
 * Success response (200):
 * ```json
 * {
 *   "success": true,
 *   "data": { "mealName": "...", "estimatedCalories": 350, "components": [...] },
 *   "usage": { "prompt_tokens": 45, "completion_tokens": 89, "total_tokens": 134 }
 * }
 * ```
 *
 * Error response (4xx/5xx):
 * ```json
 * { "success": false, "error": "..." }
 * ```
 */
export const POST: APIRoute = async ({ request }) => {
  // Validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid JSON in request body",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const validation = ExtractMealRequestSchema.safeParse(body);
  if (!validation.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: validation.error.errors[0]?.message || "Invalid request parameters",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { text } = validation.data;

  try {
    // Initialize the OpenRouter service
    const openRouterService = new OpenRouterService();

    // Send request to LLM
    const result = await openRouterService.chatCompletion<MealExtraction>({
      userMessage: `Extract meal information from the following text and respond with ONLY valid JSON (no markdown, no code blocks, no explanation):\n\n"${text}"`,
      systemMessage: `You are an expert nutrition data extractor. Your task is to analyze meal descriptions and extract structured information.

Guidelines:
- Always respond with valid JSON only (no markdown, no code blocks, no explanation text)
- Use realistic calorie estimates based on standard nutrition data
- Break down complex meals into individual components
- Include units with quantities (e.g., "200g", "1 cup")
- If unsure about exact calories, make reasonable estimates

Respond with valid JSON matching the provided schema.`,
      jsonSchema: MealExtractionSchema,
      maxTokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent results
    });

    // Return successful response with usage metrics
    return new Response(
      JSON.stringify({
        success: true,
        data: result.content,
        usage: result.usage,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Handle specific error types with appropriate HTTP status codes and messages
    if (error instanceof ConfigurationError) {
      // eslint-disable-next-line no-console
      console.error("Configuration error:", error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server is not properly configured. Please contact support.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error instanceof ApiError) {
      // Handle API authentication errors
      if (error.statusCode === 401) {
        // eslint-disable-next-line no-console
        console.error("API authentication failed:", error.message);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Server authentication failed. Please contact support.",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      // Handle rate limiting
      if (error.statusCode === 429) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Service is temporarily unavailable due to high demand. Please try again in a few moments.",
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }

      // Handle server errors (5xx)
      if (error.statusCode >= 500) {
        // eslint-disable-next-line no-console
        console.error("OpenRouter API server error:", error.message);
        return new Response(
          JSON.stringify({
            success: false,
            error: "The meal extraction service encountered a temporary error. Please try again.",
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }

      // Handle client errors (400)
      if (error.statusCode === 400) {
        // eslint-disable-next-line no-console
        console.error("Invalid request to API:", error.message);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to process meal information. Please try with a different description.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Catch-all for other API errors
      // eslint-disable-next-line no-console
      console.error("API error:", error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "An error occurred while processing your request.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error instanceof NetworkError) {
      // eslint-disable-next-line no-console
      console.error("Network error:", error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Network error occurred. Please check your connection and try again.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error instanceof ResponseParsingError) {
      // eslint-disable-next-line no-console
      console.error("Response parsing error:", error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to parse meal information. The response format was unexpected. Please try again.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in extract-meal endpoint:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred. Please try again later.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
