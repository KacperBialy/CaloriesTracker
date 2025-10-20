import type { APIRoute } from "astro";
import { ProcessMealCommandSchema, type ProcessMealCommandType } from "../../types";
import { ProcessMealService } from "../../lib/services/ProcessMealService";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // Step 1: Parse and validate request body
    const body = (await context.request.json()) as ProcessMealCommandType;

    // Step 2: Validate with Zod schema
    const validationResult = ProcessMealCommandSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(JSON.stringify(validationResult.error.errors), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Process the meal description
    const service = new ProcessMealService();
    const result = await service.process(body.text, DEFAULT_USER_ID);

    // Step 5: Determine response status based on results
    // Return 201 if at least one entry was created, otherwise 500
    if (result.successes.length === 0 && result.errors.length > 0) {
      return new Response(JSON.stringify(result), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Unexpected server error
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
