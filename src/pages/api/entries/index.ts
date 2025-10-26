import type { APIRoute } from "astro";
import { GetEntriesQuerySchema, type GetEntriesQueryType } from "../../../types";
import { EntryService } from "../../../lib/services/EntryService";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

export const prerender = false;

/**
 * GET /api/entries
 * Retrieves a list of entries for the authenticated user.
 *
 * Query Parameters:
 * - date (optional): Filter entries for a specific date in YYYY-MM-DD format
 *
 * Response:
 * - 200 OK: { data: EntryDto[], pagination: PaginationDto }
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: User not authenticated
 * - 500 Internal Server Error: Unexpected server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // Step 1: Extract and parse query parameters
    const url = new URL(context.request.url);
    const dateParam = url.searchParams.get("date") ?? undefined;

    const queryParams: GetEntriesQueryType = {
      date: dateParam,
    };

    // Step 2: Validate query parameters with Zod schema
    const validationResult = GetEntriesQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid query parameters",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Get user ID (from authenticated session)
    // Currently using DEFAULT_USER_ID for development
    const userId = DEFAULT_USER_ID;

    // Guard: Verify user is authenticated
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "User must be authenticated to access this resource",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Call EntryService to fetch entries
    const response = await EntryService.getEntries(userId, validationResult.data);

    // Step 5: Return successful response
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Unexpected server error
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
