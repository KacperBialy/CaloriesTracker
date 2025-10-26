import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { UserGoalDto } from "../../types";

/**
 * Service for managing user daily calorie goals
 * Handles fetching and updating user goals in the database
 */
export class UserGoalService {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Retrieves the current daily calorie goal for a user
   * @param userId - The authenticated user's ID
   * @returns The user's goal DTO or null if no goal exists
   * @throws Error if the database query fails
   */
  async getUserGoal(userId: string): Promise<UserGoalDto | null> {
    const { data, error } = await this.client
      .from("user_goals")
      .select("daily_calorie_goal")
      .eq("user_id", userId)
      .single();

    if (error) {
      // PGRST116 is the error code for "no rows found"
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return {
      dailyCalorieGoal: data.daily_calorie_goal,
    };
  }

  /**
   * Creates or updates a user's daily calorie goal
   * Uses an upsert operation to handle both insert and update cases
   * @param userId - The authenticated user's ID
   * @param dailyCalorieGoal - The daily calorie goal to set
   * @throws Error if the database operation fails
   */
  async upsertUserGoal(userId: string, dailyCalorieGoal: number): Promise<void> {
    // Check if the user goal already exists
    const existingGoal = await this.getUserGoal(userId);
    if (existingGoal) {
      // Update the existing goal
      await this.client
        .from("user_goals")
        .update({
          daily_calorie_goal: dailyCalorieGoal,
        })
        .eq("user_id", userId);

      return;
    }

    // Create a new goal
    await this.client.from("user_goals").insert({
      user_id: userId,
      daily_calorie_goal: dailyCalorieGoal,
    });
  }
}
