import React from "react";

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
    { name: "Protein", value: protein, unit: "g", color: "bg-red-50 border-red-200" },
    { name: "Fat", value: fat, unit: "g", color: "bg-yellow-50 border-yellow-200" },
    { name: "Carbs", value: carbs, unit: "g", color: "bg-blue-50 border-blue-200" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {nutrients.map(({ name, value, unit, color }) => (
        <div key={name} className={`${color} rounded-lg border p-4 text-center transition-colors`}>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">{name}</p>
          <p className="text-2xl font-bold text-gray-900">{Math.round(value)}</p>
          <p className="text-xs text-gray-500 mt-1">{unit}</p>
        </div>
      ))}
    </div>
  );
}
