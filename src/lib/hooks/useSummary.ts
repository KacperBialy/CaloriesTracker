import { useEffect, useState, useCallback } from "react";
import type { SummaryVM, UseSummaryHookResult, DailySummaryDto } from "../../types";

/**
 * Custom hook to fetch and manage daily summary data from /api/summary.
 * Transforms DailySummaryDto to SummaryVM, computing progress percentage if goal is set.
 *
 * @returns {UseSummaryHookResult} Hook state and refetch function
 */
export function useSummary(): UseSummaryHookResult {
  const [data, setData] = useState<SummaryVM>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  /**
   * Transforms API response to view model, computing progress percentage
   */
  const transformToViewModel = useCallback((dto: DailySummaryDto): SummaryVM => {
    const progress = dto.goal && dto.goal > 0 ? Math.min((dto.calories / dto.goal) * 100, 100) : undefined;

    return {
      calories: dto.calories,
      protein: dto.protein,
      fat: dto.fat,
      carbs: dto.carbs,
      goal: dto.goal,
      progress,
    };
  }, []);

  /**
   * Fetches summary data from API and updates state
   */
  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const response = await fetch("/api/summary");

      if (!response.ok) {
        // Handle 401 Unauthorized - user session likely expired
        if (response.status === 401) {
          const authError = new Error("Unauthorized. Please log in again.");
          setError(authError);
          // Redirect to login (would be handled by parent component or middleware)
          return;
        }

        const errorText = await response.text();
        throw new Error(`Failed to fetch summary (${response.status}): ${errorText || response.statusText}`);
      }

      const dto: DailySummaryDto = await response.json();
      const viewModel = transformToViewModel(dto);
      setData(viewModel);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error occurred");
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [transformToViewModel]);

  /**
   * Fetch summary on component mount
   */
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  /**
   * Public refetch function for manual data refresh
   */
  const refetch = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
