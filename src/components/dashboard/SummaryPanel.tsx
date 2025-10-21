import React from "react";
import type { SummaryVM } from "../../types";
import { NutrientStats } from "./NutrientStats";

interface SummaryPanelProps {
  summary: SummaryVM;
}

/**
 * SummaryPanel displays the user's daily calorie progress and macronutrient breakdown.
 * Shows a progress bar if goal is set, otherwise displays "Goal not set" message.
 */
export function SummaryPanel({ summary }: SummaryPanelProps): React.ReactNode {
  const goalNotSet = summary.goal === null || summary.goal === 0;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Today &apos;s Summary</h2>

      {/* Calories Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Calories</span>
          <span className="text-sm font-semibold text-gray-900">
            {Math.round(summary.calories)}
            {!goalNotSet && ` / ${summary.goal}`}
            {goalNotSet && " kcal"}
          </span>
        </div>

        {!goalNotSet ? (
          <>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${summary.progress ?? 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{Math.round(summary.progress ?? 0)}% of daily goal</p>
          </>
        ) : (
          <p className="text-xs text-gray-500 italic">Goal not set</p>
        )}
      </div>

      {/* Macronutrients Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Macronutrients</h3>
        <NutrientStats protein={summary.protein} fat={summary.fat} carbs={summary.carbs} />
      </div>
    </div>
  );
}
