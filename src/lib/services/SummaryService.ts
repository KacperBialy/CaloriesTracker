import { supabaseClient } from "../../db/supabase.client";
import type { DailySummaryDto } from "../../types";

interface EntryWithProduct {
  quantity: number;
  products: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    nutrition_basis: string;
  };
}

/**
 * Retrieves aggregated nutrition summary and user goal for a given date
 */
export async function getDailySummary(userId: string, date?: string): Promise<DailySummaryDto> {
  const targetDate = date ?? new Date().toISOString().split("T")[0];

  // Fetch entries with product details
  const { data: entries, error: entriesError } = await supabaseClient
    .from("entries")
    .select(`quantity, products(calories, protein, fat, carbs, nutrition_basis)`)
    .eq("user_id", userId)
    .eq("consumed_at", targetDate);
  if (entriesError) {
    throw new Error(`Database error fetching entries: ${entriesError.message}`);
  }

  let calories = 0;
  let protein = 0;
  let fat = 0;
  let carbs = 0;

  for (const entry of entries ?? []) {
    const { quantity: qty, products } = entry as EntryWithProduct;
    const basis = String(products.nutrition_basis).toLowerCase();
    const factor = basis === "100g" || basis === "100ml" ? qty / 100 : qty;
    calories += products.calories * factor;
    protein += products.protein * factor;
    fat += products.fat * factor;
    carbs += products.carbs * factor;
  }

  // Fetch user goal
  const { data: goalRow, error: goalError } = await supabaseClient
    .from("user_goals")
    .select("daily_calorie_goal")
    .eq("user_id", userId)
    .single();
  if (goalError && goalError.code !== "PGRST116") {
    throw new Error(`Database error fetching user goal: ${goalError.message}`);
  }
  const goal = goalRow?.daily_calorie_goal ?? null;

  return { calories, protein, fat, carbs, goal };
}
