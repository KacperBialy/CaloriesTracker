import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDailySummary } from "../SummaryService";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

describe("SummaryService", () => {
  let mockSupabaseClient: SupabaseClient<Database>;

  beforeEach(() => {
    // Create a mock Supabase client
    mockSupabaseClient = {
      from: vi.fn(),
    } as unknown as SupabaseClient<Database>;
  });

  describe("getDailySummary", () => {
    it("should calculate totals correctly when entries exist", async () => {
      const mockEntries = [
        {
          quantity: 100,
          products: {
            calories: 52,
            protein: 0.3,
            carbs: 14,
            fat: 0.2,
            nutrition_basis: "100g",
          },
        },
        {
          quantity: 120,
          products: {
            calories: 105,
            protein: 1.3,
            carbs: 27,
            fat: 0.4,
            nutrition_basis: "100g",
          },
        },
      ];

      const mockGoal = {
        daily_calorie_goal: 2000,
      };

      const mockEntriesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      mockEntriesQuery.eq.mockImplementation((field: string) => {
        if (field === "consumed_at") {
          return Promise.resolve({ data: mockEntries, error: null });
        }
        return mockEntriesQuery;
      });

      const mockGoalQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGoal, error: null }),
      };

      vi.mocked(mockSupabaseClient.from).mockImplementation((table: string) => {
        if (table === "entries") {
          return mockEntriesQuery as unknown as ReturnType<typeof mockSupabaseClient.from>;
        }
        if (table === "user_goals") {
          return mockGoalQuery as unknown as ReturnType<typeof mockSupabaseClient.from>;
        }
        return {} as ReturnType<typeof mockSupabaseClient.from>;
      });

      const result = await getDailySummary(mockSupabaseClient, "user-123", "2025-10-27");

      expect(result.calories).toBeCloseTo(178, 0);
      expect(result.protein).toBeCloseTo(1.86, 1);
      expect(result.carbs).toBeCloseTo(46.4, 1);
      expect(result.fat).toBeCloseTo(0.68, 1);
      expect(result.goal).toBe(2000);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("entries");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("user_goals");
    });
  });
});
