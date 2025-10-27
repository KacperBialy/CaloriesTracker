import type { APIRoute } from "astro";
import { GetEntriesQuerySchema, type GetEntriesQueryType } from "../../../types";
import { EntryService } from "../../../lib/services/EntryService";

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

    // Guard: Verify user is authenticated
    if (!context.locals.user) {
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

    // Guard: Verify supabase client is available
    if (!context.locals.supabase) {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Database connection unavailable",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Call EntryService to fetch entries
    const service = new EntryService(context.locals.supabase);
    const response = await service.getEntries(context.locals.user.id, validationResult.data);

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
