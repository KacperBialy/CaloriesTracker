import { useEffect, useState, useCallback } from "react";
import type { EntryDto, EntriesResponseDto } from "@/types";

/**
 * Custom hook to fetch and manage consumed product entries for the current day.
 * Handles data fetching, deletion, and state management.
 *
 * @returns Object containing entries array, loading state, error, and deleteEntry function
 */
export function useEntries() {
  const [entries, setEntries] = useState<EntryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetches entries for the current date
   */
  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/entries?date=${today}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Please log in again.");
        }
        throw new Error("Failed to load entries. Please try refreshing the page.");
      }

      const data: EntriesResponseDto = await response.json();

      // Sort entries chronologically (most recent first)
      const sorted = [...data.data].sort((a, b) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime());

      setEntries(sorted);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error occurred");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Deletes an entry by ID
   * @param entryId - The ID of the entry to delete
   * @throws Error if deletion fails
   */
  const deleteEntry = useCallback(async (entryId: string) => {
    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Entry not found. It may have already been deleted.");
        }
        if (response.status === 403) {
          throw new Error("You do not have permission to delete this entry.");
        }
        throw new Error("Failed to delete entry. Please try again.");
      }

      // Remove from local state on success
      setEntries((prev) => prev.filter((e) => e.entryId !== entryId));
    } catch (err) {
      throw err instanceof Error ? err : new Error("Unknown error occurred");
    }
  }, []);

  /**
   * Fetch entries on component mount
   */
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    isLoading,
    error,
    deleteEntry,
  };
}
