import type { EntryDto, ErrorDto, NutritionDto, ProductEntity, ProductInsert } from "../../types";
import { supabaseClient } from "../../db/supabase.client";
import { LLMClient } from "../llm-client";

/**
 * Represents a single parsed meal item (output from LLM parsing)
 */
interface ParsedMealItem {
  name: string;
  quantity: number;
}

/**
 * ProcessMealService handles the orchestration of:
 * 1. Parsing free-text meal descriptions using LLM
 * 2. Looking up or creating products in the database
 * 3. Inserting consumption entries for each product
 * 4. Aggregating successes and errors for the response
 */
export class ProcessMealService {
  private llmClient: LLMClient;

  constructor() {
    this.llmClient = new LLMClient();
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
   * Parses free-text meal description into structured items using LLM
   *
   * @param text - Raw meal description
   * @returns Array of parsed meal items with name and quantity
   * @throws Error if LLM parsing fails
   */
  private async parseText(text: string): Promise<ParsedMealItem[]> {
    const parsed = await this.llmClient.parseMealDescription(text);
    return parsed;
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
    const nutrition = await this.llmClient.fetchNutritionData(originalName);

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
