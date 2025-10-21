import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Today&apos;s Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Calories Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Calories</span>
            <span className="text-sm font-semibold">
              {Math.round(summary.calories)}
              {!goalNotSet && ` / ${summary.goal}`}
              {goalNotSet && " kcal"}
            </span>
          </div>

          {!goalNotSet ? (
            <>
              {/* Progress Bar */}
              <Progress value={summary.progress ?? 0} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">{Math.round(summary.progress ?? 0)}% of daily goal</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">Goal not set</p>
          )}
        </div>

        {/* Macronutrients Section */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium mb-4">Macronutrients</h3>
          <NutrientStats protein={summary.protein} fat={summary.fat} carbs={summary.carbs} />
        </div>
      </CardContent>
    </Card>
  );
}
