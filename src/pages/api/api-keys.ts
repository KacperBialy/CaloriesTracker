import type { APIRoute } from "astro";
import { ApiKeyService } from "../../lib/services/ApiKeyService";

export const prerender = false;

/**
 * GET /api/api-keys
 * Retrieves the authenticated user's current API key
 *
 * @returns 200 OK with ApiKeyDto, 404 if key not found
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;

    if (!supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize service and fetch user API key
    const service = new ApiKeyService(supabase);
    const apiKey = await service.getUserApiKey(locals.user.id);

    // Return 404 if user has not generated a key yet
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(apiKey), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * POST /api/api-keys
 * Generates a new API key for the authenticated user
 * Replaces any existing key
 *
 * @returns 200 OK with the newly generated ApiKeyDto
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;

    if (!supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize service and generate new API key
    const service = new ApiKeyService(supabase);
    const apiKey = await service.generateApiKey(locals.user.id);

    return new Response(JSON.stringify(apiKey), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * DELETE /api/api-keys
 * Revokes the authenticated user's API key
 *
 * @returns 200 OK on success
 */
export const DELETE: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;

    if (!supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize service and revoke API key
    const service = new ApiKeyService(supabase);
    await service.revokeApiKey(locals.user.id);

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
