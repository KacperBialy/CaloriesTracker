import type { APIRoute } from "astro";
import { UserGoalService } from "../../lib/services/UserGoalService";
import { UpsertUserGoalCommandSchema } from "../../types";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

export const prerender = false;

/**
 * GET /api/user-goals
 * Retrieves the authenticated user's daily calorie goal
 *
 * @returns 200 OK with UserGoalDto, 404 if goal not found
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use DEFAULT_USER_ID for MVP
    const userId = DEFAULT_USER_ID;

    // Initialize service and fetch user goal
    const service = new UserGoalService(supabase);
    const goal = await service.getUserGoal(userId);

    // Return 404 if user has not set a goal yet
    if (!goal) {
      return new Response(JSON.stringify({ error: "User goal not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(goal), {
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
 * PUT /api/user-goals
 * Creates or updates the authenticated user's daily calorie goal
 *
 * Request body: { dailyCalorieGoal: number }
 * @returns 200 OK on success, 400 if validation fails
 */
export const PUT: APIRoute = async ({ locals, request }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = (await request.json()) as unknown;
    const validationResult = UpsertUserGoalCommandSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Extract validated data
    const { dailyCalorieGoal } = validationResult.data;

    // Use DEFAULT_USER_ID for MVP
    const userId = DEFAULT_USER_ID;

    // Initialize service and upsert user goal
    const service = new UserGoalService(supabase);
    await service.upsertUserGoal(userId, dailyCalorieGoal);

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
