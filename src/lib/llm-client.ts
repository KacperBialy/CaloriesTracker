/**
 * Represents the structure of nutrition data returned by the LLM
 */
export interface NutritionData {
  nutritionBasis: "100g" | "100ml" | "unit";
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

/**
 * Represents a parsed meal item (name + quantity) from LLM parsing
 */
export interface ParsedMealItem {
  name: string;
  quantity: number;
}

/**
 * LLMClient (Mock) - Returns consistent mock data for now
 * This is a temporary implementation that will be replaced with real LLM calls later.
 *
 * The mock implementation:
 * - Parses simple meal descriptions based on keywords
 * - Returns realistic nutrition data for common foods
 * - Maintains the same interface as the future real implementation
 */
export class LLMClient {
  /**
   * Mock nutrition database for common foods
   */
  private mockNutritionDb: Record<string, NutritionData> = {
    chicken: {
      nutritionBasis: "100g",
      calories: 165,
      protein: 31,
      fat: 3.6,
      carbs: 0,
    },
    rice: {
      nutritionBasis: "100g",
      calories: 130,
      protein: 2.7,
      fat: 0.3,
      carbs: 28,
    },
    bread: {
      nutritionBasis: "100g",
      calories: 265,
      protein: 9,
      fat: 1.5,
      carbs: 49,
    },
    egg: {
      nutritionBasis: "unit",
      calories: 78,
      protein: 6,
      fat: 6,
      carbs: 0.6,
    },
    milk: {
      nutritionBasis: "100ml",
      calories: 61,
      protein: 3.2,
      fat: 3.3,
      carbs: 4.8,
    },
    apple: {
      nutritionBasis: "100g",
      calories: 52,
      protein: 0.3,
      fat: 0.2,
      carbs: 14,
    },
    banana: {
      nutritionBasis: "100g",
      calories: 89,
      protein: 1.1,
      fat: 0.3,
      carbs: 23,
    },
    broccoli: {
      nutritionBasis: "100g",
      calories: 34,
      protein: 2.8,
      fat: 0.4,
      carbs: 7,
    },
    salmon: {
      nutritionBasis: "100g",
      calories: 208,
      protein: 22,
      fat: 13,
      carbs: 0,
    },
    pasta: {
      nutritionBasis: "100g",
      calories: 131,
      protein: 5,
      fat: 1.1,
      carbs: 25,
    },
  };

  /**
   * Mock implementation: Parses a free-text meal description
   * Extracts food names and quantities using simple heuristics
   *
   * @param text - Raw meal description (e.g., "chicken 200g and rice 100g")
   * @returns Array of parsed meal items
   *
   * Example:
   * Input: "200g chicken and 100g rice"
   * Output: [
   *   { name: "chicken", quantity: 200 },
   *   { name: "rice", quantity: 100 }
   * ]
   */
  async parseMealDescription(text: string): Promise<ParsedMealItem[]> {
    const items: ParsedMealItem[] = [];

    // Simple regex to find patterns like "200g chicken" or "chicken 200g"
    const patterns = [
      /(\d+)\s*(?:g|gram|grams)\s+([a-z]+)/gi, // "200g chicken"
      /([a-z]+)\s+(\d+)\s*(?:g|gram|grams)/gi, // "chicken 200g"
      /(\d+)\s*(?:ml|milliliters?)\s+([a-z]+)/gi, // "100ml milk"
      /([a-z]+)\s+(\d+)\s*(?:ml|milliliters?)/gi, // "milk 100ml"
    ];

    const foundNames = new Set<string>();

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const quantity = parseInt(match[1], 10);
        let foodName = match[2];

        // Normalize food name (singular form, lowercase)
        foodName = foodName.toLowerCase().replace(/s$/, "");

        // Check if it's in our mock database
        if (this.mockNutritionDb[foodName] && !foundNames.has(foodName)) {
          items.push({ name: foodName, quantity });
          foundNames.add(foodName);
        }
      }
    }

    // If no items found with regex, try simple word matching
    if (items.length === 0) {
      const words = text.toLowerCase().split(/\s+/);
      for (const word of words) {
        const foodName = word.replace(/[^a-z]/g, "");
        if (this.mockNutritionDb[foodName] && !foundNames.has(foodName)) {
          items.push({ name: foodName, quantity: 100 }); // Default 100g if no quantity specified
          foundNames.add(foodName);
        }
      }
    }

    return items;
  }

  /**
   * Mock implementation: Fetches nutrition data for a product
   * Returns data from the mock nutrition database
   *
   * @param productName - Name of the product (e.g., "chicken")
   * @returns Nutrition data, or default values if product not found
   */
  async fetchNutritionData(productName: string): Promise<NutritionData> {
    const normalized = productName.toLowerCase().replace(/[^a-z]/g, "");

    // Check if product exists in mock database
    if (this.mockNutritionDb[normalized]) {
      return this.mockNutritionDb[normalized];
    }

    // Return default values for unknown products
    return {
      nutritionBasis: "100g",
      calories: 100,
      protein: 5,
      fat: 2,
      carbs: 15,
    };
  }
}
