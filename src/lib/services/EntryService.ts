import { supabaseClient } from "../../db/supabase.client";
import type { EntryDto, EntriesResponseDto, GetEntriesQueryType } from "../../types";

interface EntryWithProduct {
  id: string;
  quantity: number;
  consumed_at: string;
  products: {
    id: string;
    name: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

/**
 * Service for managing user entries (meals)
 */
export class EntryService {
  /**
   * Retrieves entries for a user with optional date filtering
   * @param userId - The authenticated user's ID
   * @param query - Query parameters (optional date filter in YYYY-MM-DD format)
   * @returns EntriesResponseDto with entries and pagination metadata
   * @throws Error if database query fails
   */
  static async getEntries(userId: string, query: GetEntriesQueryType): Promise<EntriesResponseDto> {
    // Guard: Validate user ID
    if (!userId || typeof userId !== "string") {
      throw new Error("Invalid user ID");
    }

    try {
      // Build query with entries and product details
      let supabaseQuery = supabaseClient
        .from("entries")
        .select(`id, quantity, consumed_at, products(id, name, calories, protein, fat, carbs)`)
        .eq("user_id", userId)
        .order("consumed_at", { ascending: false });

      // Apply date filter if provided
      if (query.date) {
        supabaseQuery = supabaseQuery.eq("consumed_at", query.date);
      }

      const { data: rawEntries, error } = await supabaseQuery;

      if (error) {
        throw new Error(`Database error fetching entries: ${error.message}`);
      }

      // Transform raw database results to EntryDto format
      const entries: EntryDto[] = (rawEntries ?? []).map((entry: EntryWithProduct) => ({
        entryId: entry.id,
        productId: entry.products.id,
        name: entry.products.name,
        quantity: entry.quantity,
        nutrition: {
          calories: Number(((entry.quantity / 100) * entry.products.calories).toFixed(2)),
          protein: Number(((entry.quantity / 100) * entry.products.protein).toFixed(2)),
          fat: Number(((entry.quantity / 100) * entry.products.fat).toFixed(2)),
          carbs: Number(((entry.quantity / 100) * entry.products.carbs).toFixed(2)),
        },
        consumedAt: entry.consumed_at,
      }));

      // Return response with pagination metadata
      return {
        data: entries,
        pagination: {
          page: 1,
          size: entries.length,
          total: entries.length,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unexpected error retrieving entries");
    }
  }

  /**
   * Deletes an entry, enforcing user ownership
   * @param userId - The authenticated user's ID
   * @param entryId - The entry ID to delete
   * @returns Object with success status and reason if applicable
   * @throws Error only for unexpected database errors
   */
  static async deleteEntry(
    userId: string,
    entryId: string
  ): Promise<{ success: boolean; reason?: "not-found" | "forbidden" }> {
    // Guard: Validate inputs
    if (!userId || typeof userId !== "string") {
      throw new Error("Invalid user ID");
    }

    if (!entryId || typeof entryId !== "string") {
      throw new Error("Invalid entry ID");
    }

    try {
      // First, fetch the entry to verify ownership
      const { data: entry, error: fetchError } = await supabaseClient
        .from("entries")
        .select("id, user_id")
        .eq("id", entryId)
        .single();

      if (fetchError) {
        // Entry not found (PGRST116 is the Postgres error code for "no rows")
        if (fetchError.code === "PGRST116") {
          return { success: false, reason: "not-found" };
        }
        throw new Error(`Database error fetching entry: ${fetchError.message}`);
      }

      // Guard: Verify ownership
      if (entry.user_id !== userId) {
        return { success: false, reason: "forbidden" };
      }

      // Delete the entry
      const { error: deleteError } = await supabaseClient
        .from("entries")
        .delete()
        .eq("id", entryId)
        .eq("user_id", userId);

      if (deleteError) {
        throw new Error(`Database error deleting entry: ${deleteError.message}`);
      }

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unexpected error deleting entry");
    }
  }
}
