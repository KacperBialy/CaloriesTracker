import { z } from "zod";
import type { EntryDto, ErrorDto, NutritionDto, ProductEntity, ProductInsert } from "../../types";
import { supabaseClient } from "../../db/supabase.client";
import { OpenRouterService, ResponseParsingError } from "./OpenRouterService";

/**
 * Represents a single parsed meal item (output from LLM parsing)
 */
interface ParsedMealItem {
  name: string;
  quantity: number;
}

/**
 * Zod schema for meal parsing response from LLM
 */
const ParsedMealSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe("Name of the food item"),
      quantity: z.number().describe("Quantity in the unit specified"),
    })
  ),
});

type ParsedMealResponse = z.infer<typeof ParsedMealSchema>;

/**
 * Zod schema for nutrition data response from LLM
 */
const NutritionDataSchema = z.object({
  nutritionBasis: z.enum(["100g", "100ml", "unit"]).describe("Basis for nutrition values"),
  calories: z.number().describe("Calories per basis"),
  protein: z.number().describe("Protein in grams"),
  fat: z.number().describe("Fat in grams"),
  carbs: z.number().describe("Carbohydrates in grams"),
});

type NutritionDataResponse = z.infer<typeof NutritionDataSchema>;

/**
 * ProcessMealService handles the orchestration of:
 * 1. Parsing free-text meal descriptions using OpenRouter LLM
 * 2. Looking up or creating products in the database
 * 3. Inserting consumption entries for each product
 * 4. Aggregating successes and errors for the response
 */
export class ProcessMealService {
  private openRouterService: OpenRouterService;

  constructor() {
    this.openRouterService = new OpenRouterService();
  }

  /**
   * Main orchestration method: processes a free-text meal description
   * Returns both successful entries and any errors encountered
   *
   * @param text - Raw meal description (e.g., "chicken 200g and rice 100g")
   * @param userId - ID of the user consuming the meal
   * @returns Promise with successes and errors arrays
   */
  async process(text: string, userId: string) {
    const successes: EntryDto[] = [];
    const errors: ErrorDto[] = [];

    // Step 1: Parse text into meal items using LLM
    let parsedItems: ParsedMealItem[] = [];
    try {
      parsedItems = await this.parseText(text);
      if (parsedItems.length === 0) {
        errors.push({
          text,
          message: "No recognizable meal items found in the input",
        });
        return { successes, errors };
      }
    } catch (error) {
      errors.push({
        text,
        message: `Failed to parse meal description: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      return { successes, errors };
    }

    // Step 2: Batch lookup products by normalized names (optimization)
    const normalizedNames = parsedItems.map((item) => item.name.toLowerCase().trim());
    let existingProducts: Map<string, ProductEntity>;
    try {
      existingProducts = await this.batchLookupProducts(normalizedNames);
    } catch (error) {
      errors.push({
        text,
        message: `Failed to lookup products: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      return { successes, errors };
    }

    // Step 3: Process each parsed item: fetch/create product, then create entry
    for (const item of parsedItems) {
      try {
        const normalizedName = item.name.toLowerCase().trim();

        // Fetch or create product
        let product = existingProducts.get(normalizedName);
        if (!product) {
          product = await this.fetchOrCreateProduct(normalizedName, item.name);
        }

        // Validate quantity
        if (item.quantity <= 0) {
          errors.push({
            text: `${item.name} ${item.quantity}`,
            message: "Quantity must be greater than zero",
          });
          continue;
        }

        // Insert entry
        const entry = await this.insertEntry(product, item.quantity, userId);
        successes.push(entry);
      } catch (error) {
        errors.push({
          text: `${item.name} ${item.quantity}`,
          message: `Failed to create entry: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }

    return { successes, errors };
  }

  /**
   * Parses free-text meal description into structured items using OpenRouter LLM
   *
   * @param text - Raw meal description
   * @returns Array of parsed meal items with name and quantity
   * @throws Error if LLM parsing fails
   */
  private async parseText(text: string): Promise<ParsedMealItem[]> {
    try {
      const result = await this.openRouterService.chatCompletion<ParsedMealResponse>({
        userMessage: `Parse the following meal description and extract food items with quantities. Respond with ONLY valid JSON (no markdown, no code blocks):\n\n"${text}"`,
        systemMessage: `You are an expert nutrition data parser. Analyze meal descriptions and extract individual food items with quantities.

Guidelines:
- Extract all identifiable food items from the description
- Include quantity for each item (default to 100 if not specified)
- Use standard units (g for weight, ml for volume, unit for individual items)
- Normalize food names to lowercase singular form
- Return ONLY valid JSON with no additional text

Example output: {"items": [{"name": "chicken", "quantity": 200}, {"name": "rice", "quantity": 100}]}`,
        jsonSchema: ParsedMealSchema,
        maxTokens: 500,
        temperature: 0.3,
      });

      return result.content.items.map((item) => ({
        name: item.name.toLowerCase().trim(),
        quantity: item.quantity,
      }));
    } catch (error) {
      // If it's a ResponseParsingError, provide context about the failure
      if (error instanceof ResponseParsingError) {
        throw new Error(`LLM meal parsing failed: Unable to parse response in expected format`);
      }
      throw error;
    }
  }

  /**
   * Batch lookup products by normalized names
   * Optimization to avoid N+1 queries
   *
   * @param normalizedNames - Array of lowercase, trimmed product names
   * @returns Map of normalized name to ProductEntity
   */
  private async batchLookupProducts(normalizedNames: string[]): Promise<Map<string, ProductEntity>> {
    if (normalizedNames.length === 0) {
      return new Map();
    }

    const { data, error } = await supabaseClient.from("products").select("*").in("name", normalizedNames);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const productMap = new Map<string, ProductEntity>();
    if (data) {
      for (const product of data) {
        const normalizedKey = product.name.toLowerCase().trim();
        productMap.set(normalizedKey, product);
      }
    }

    return productMap;
  }

  /**
   * Fetches or creates a product in the database
   * If product doesn't exist, fetches nutrition data via LLM and inserts new row
   *
   * @param normalizedName - Lowercase, trimmed product name
   * @param originalName - Original product name for LLM lookup
   * @returns The ProductEntity (existing or newly created)
   * @throws Error if fetch/creation fails
   */
  private async fetchOrCreateProduct(normalizedName: string, originalName: string): Promise<ProductEntity> {
    // Try to fetch from database
    const { data: existing, error: fetchError } = await supabaseClient
      .from("products")
      .select("*")
      .eq("name", normalizedName)
      .single();

    if (existing) {
      return existing;
    }

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows returned (not an error)
      throw new Error(`Lookup failed: ${fetchError.message}`);
    }

    // Product doesn't exist; fetch nutrition via LLM
    const nutrition = await this.fetchNutritionData(originalName);

    // Insert new product
    const productInsert: ProductInsert = {
      name: normalizedName,
      nutrition_basis: nutrition.nutritionBasis,
      calories: nutrition.calories,
      protein: nutrition.protein,
      fat: nutrition.fat,
      carbs: nutrition.carbs,
    };

    const { data: newProduct, error: insertError } = await supabaseClient
      .from("products")
      .insert([productInsert])
      .select()
      .single();

    if (insertError || !newProduct) {
      throw new Error(`Failed to create product: ${insertError?.message || "Unknown error"}`);
    }

    return newProduct;
  }

  /**
   * Fetches nutrition data for a product from OpenRouter LLM
   *
   * @param productName - Name of the product
   * @returns Nutrition data for the product
   * @throws Error if LLM call or parsing fails
   */
  private async fetchNutritionData(productName: string): Promise<NutritionDataResponse> {
    try {
      const result = await this.openRouterService.chatCompletion<NutritionDataResponse>({
        userMessage: `Provide nutrition data for "${productName}". Respond with ONLY valid JSON (no markdown, no code blocks):`,
        systemMessage: `You are a nutrition expert. Provide accurate nutritional information for food items.

Guidelines:
- Return realistic nutrition values based on standard USDA/nutrition database data
- Use 100g as basis for solids, 100ml for liquids, "unit" for individual items (eggs, etc.)
- Include calories (per basis), protein, fat, and carbohydrates in grams
- Return ONLY valid JSON with no additional text

Example: {"nutritionBasis": "100g", "calories": 165, "protein": 31, "fat": 3.6, "carbs": 0}`,
        jsonSchema: NutritionDataSchema,
        maxTokens: 300,
        temperature: 0.2, // Very low temperature for consistency
      });

      return result.content;
    } catch (error) {
      // If it's a ResponseParsingError, provide context
      if (error instanceof ResponseParsingError) {
        throw new Error(`Failed to fetch nutrition data for "${productName}": Invalid response format`);
      }
      throw error;
    }
  }

  /**
   * Inserts a consumption entry into the database
   *
   * @param product - The ProductEntity being consumed
   * @param quantity - Quantity consumed (in the product's nutrition_basis unit)
   * @param userId - ID of the user consuming the product
   * @returns EntryDto representing the created entry
   * @throws Error if insertion fails
   */
  private async insertEntry(product: ProductEntity, quantity: number, userId: string): Promise<EntryDto> {
    const today = new Date().toISOString().split("T")[0];

    const { data: entry, error } = await supabaseClient
      .from("entries")
      .insert([
        {
          user_id: userId,
          product_id: product.id,
          quantity,
          consumed_at: today,
        },
      ])
      .select()
      .single();

    if (error || !entry) {
      throw new Error(`Failed to insert entry: ${error?.message || "Unknown error"}`);
    }

    const nutrition: NutritionDto = {
      calories: product.calories,
      protein: product.protein,
      fat: product.fat,
      carbs: product.carbs,
    };

    return {
      entryId: entry.id,
      productId: entry.product_id,
      name: product.name,
      quantity: entry.quantity,
      nutrition,
      consumedAt: entry.consumed_at,
    };
  }
}
