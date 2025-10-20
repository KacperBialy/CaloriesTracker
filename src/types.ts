import type { Database } from "./db/database.types";
import { z } from "zod";

// Aliases for base database types
export type EntryEntity = Database["public"]["Tables"]["entries"]["Row"];
export type EntryInsert = Database["public"]["Tables"]["entries"]["Insert"];
export type EntryUpdate = Database["public"]["Tables"]["entries"]["Update"];
export type ProductEntity = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
export type UserGoalEntity = Database["public"]["Tables"]["user_goals"]["Row"];
export type UserGoalInsert = Database["public"]["Tables"]["user_goals"]["Insert"];
export type UserGoalUpdate = Database["public"]["Tables"]["user_goals"]["Update"];

// 1. Command to process free-text meal input
export interface ProcessMealCommand {
  /** Raw meal description, e.g. "chicken 200g and rice 100g" */
  text: string;
}

// 2. Error item returned when parsing or saving fails
export interface ErrorDto {
  /** Original text fragment that failed */
  text: string;
  /** Human-readable failure reason */
  message: string;
}

// 3. Nutrition details (extracted from product Row)
export type NutritionDto = Pick<ProductEntity, "calories" | "protein" | "fat" | "carbs">;

// 4. Entry representation in responses (success case)
export interface EntryDto {
  /** Entry UUID */
  entryId: string;
  /** Associated product UUID */
  productId: string;
  /** Human-readable product name */
  name: string;
  /** Quantity consumed */
  quantity: number;
  /** Nutrition snapshot at time of entry */
  nutrition: NutritionDto;
  /** ISO date string, e.g. "2025-10-19" */
  consumedAt: string;
}

// 5. Response from processing a free-text command
export interface ProcessResponseDto {
  successes: EntryDto[];
  errors: ErrorDto[];
}

// 6. Query parameters for listing entries
export interface GetEntriesQuery {
  /** ISO date filter (defaults to today) */
  date?: string;
  /** Page number (default 1) */
  page?: number;
  /** Page size (default 20) */
  size?: number;
  /** Sort string, e.g. "consumed_at:desc" */
  sort?: string;
}

// 7. Standard pagination metadata
export interface PaginationDto {
  page: number;
  size: number;
  total: number;
}

// 8. Response from GET /api/entries
export interface EntriesResponseDto {
  data: EntryDto[];
  pagination: PaginationDto;
}

// 9. Query parameters for searching products
export interface SearchProductsQuery {
  /** Substring match on product name */
  name?: string;
}

// 10. Product data transferred via API
export interface ProductDto {
  /** Product UUID */
  productId: string;
  /** Product name */
  name: string;
  /** Basis for nutrition values ("100g"|"100ml"|"unit") */
  nutritionBasis: "100g" | "100ml" | "unit";
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

// 11. User's calorie goal returned from GET /api/user-goals
export interface UserGoalDto {
  dailyCalorieGoal: number;
}

// 12. Command to create or update user calorie goal
export interface UpsertUserGoalCommand {
  dailyCalorieGoal: number;
}

// 13. Aggregated daily summary including goal
export type DailySummaryDto = NutritionDto & {
  /** Current user's goal; null if not set */
  goal: number | null;
};

// ============================================================================
// Zod Validation Schemas
// ============================================================================

/**
 * Validates ProcessMealCommand input
 * - text: non-empty string, max 1000 characters
 */
export const ProcessMealCommandSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Meal description cannot be empty")
    .max(1000, "Meal description cannot exceed 1000 characters"),
});

export type ProcessMealCommandType = z.infer<typeof ProcessMealCommandSchema>;
