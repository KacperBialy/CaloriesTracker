import type { APIRoute } from "astro";
import { EntryIdParamSchema } from "../../../types";
import { EntryService } from "../../../lib/services/EntryService";

export const prerender = false;

/**
 * DELETE /api/entries/[entryId]
 * Deletes a specific entry for the authenticated user.
 *
 * Path Parameters:
 * - entryId (required): The UUID of the entry to delete
 *
 * Response:
 * - 204 No Content: Entry successfully deleted
 * - 400 Bad Request: Invalid entryId format (not a valid UUID)
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: User does not own the entry
 * - 404 Not Found: Entry does not exist
 * - 500 Internal Server Error: Unexpected server error
 */
export const DELETE: APIRoute = async (context) => {
  try {
    // Step 1: Extract entryId from path parameter
    const { entryId } = context.params;

    // Step 2: Validate entryId with Zod schema
    const validationResult = EntryIdParamSchema.safeParse({ entryId });
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid entry ID format",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Guard: Verify supabase client is available
    if (!context.locals.supabase || !context.locals.user) {
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

    // Step 4: Call EntryService to delete entry
    const service = new EntryService(context.locals.supabase);
    const deleteResult = await service.deleteEntry(context.locals.user.id, validationResult.data.entryId);

    // Step 5: Handle deletion results and return appropriate response
    if (!deleteResult.success) {
      // Entry not found
      if (deleteResult.reason === "not-found") {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "The entry with the specified ID does not exist",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Entry belongs to another user
      if (deleteResult.reason === "forbidden") {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "You do not have permission to delete this entry",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Successfully deleted - return 204 No Content
    return new Response(null, {
      status: 204,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
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
