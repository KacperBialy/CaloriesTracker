import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface NutrientStatsProps {
  protein: number;
  fat: number;
  carbs: number;
}

/**
 * NutrientStats displays the daily breakdown of macronutrients:
 * protein, fat, and carbohydrates in grams.
 */
export function NutrientStats({ protein, fat, carbs }: NutrientStatsProps): React.ReactNode {
  const nutrients = [
    { name: "Protein", value: protein, unit: "g", color: "text-red-600" },
    { name: "Fat", value: fat, unit: "g", color: "text-yellow-600" },
    { name: "Carbs", value: carbs, unit: "g", color: "text-blue-600" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4" data-test-id="nutrient-stats">
      {nutrients.map(({ name, value, unit, color }) => (
        <Card key={name} className="text-center" data-test-id={`nutrient-stats-${name.toLowerCase()}`}>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{name}</p>
            <p className={`text-2xl font-bold ${color}`} data-test-id={`nutrient-stats-${name.toLowerCase()}-value`}>
              {Math.round(value)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{unit}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
