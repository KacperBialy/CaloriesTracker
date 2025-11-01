import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";
import type { ProductInsert, EntryInsert } from "../../src/types";

/**
 * Global test data tracker
 * Stores IDs of created entities so they can be cleaned up after tests
 */
export const testData = {
  productIds: [] as string[],
  entryIds: [] as string[],
};

/**
 * Seeded test products - used in global setup and test assertions
 */
export const SEEDED_PRODUCTS: ProductInsert[] = [
  {
    name: "Chicken Breast",
    nutrition_basis: "100g",
    calories: 165,
    protein: 31,
    fat: 3.6,
    carbs: 0,
  },
  {
    name: "Brown Rice",
    nutrition_basis: "100g",
    calories: 112,
    protein: 2.6,
    fat: 0.9,
    carbs: 24,
  },
  {
    name: "Broccoli",
    nutrition_basis: "100g",
    calories: 34,
    protein: 2.8,
    fat: 0.4,
    carbs: 7,
  },
];

/**
 * Seeded test entries quantities
 * Index corresponds to product index in SEEDED_PRODUCTS
 */
export const SEEDED_ENTRY_QUANTITIES = [150, 100, 200];

/**
 * Calculate expected total calories from seeded entries
 */
export function getExpectedTotalCalories(): number {
  return Math.round(
    SEEDED_PRODUCTS.reduce((total, product, index) => {
      const quantity = SEEDED_ENTRY_QUANTITIES[index];
      return total + (product.calories * quantity) / 100;
    }, 0)
  );
}

/**
 * Calculate expected macronutrient totals from seeded entries
 */
export function getExpectedMacronutrients(): {
  protein: number;
  fat: number;
  carbs: number;
} {
  const totals = SEEDED_PRODUCTS.reduce(
    (acc, product, index) => {
      const quantity = SEEDED_ENTRY_QUANTITIES[index];
      return {
        protein: acc.protein + (product.protein * quantity) / 100,
        fat: acc.fat + (product.fat * quantity) / 100,
        carbs: acc.carbs + (product.carbs * quantity) / 100,
      };
    },
    { protein: 0, fat: 0, carbs: 0 }
  );

  return {
    protein: Math.round(totals.protein),
    fat: Math.round(totals.fat),
    carbs: Math.round(totals.carbs),
  };
}

/**
 * Initialize Supabase client for E2E tests
 * Uses environment variables for configuration
 */
function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  const userId = process.env.E2E_USERNAME_ID;

  if (!url || !key || !userId) {
    throw new Error("Missing required environment variables: SUPABASE_URL, SUPABASE_KEY, or E2E_USERNAME_ID");
  }

  return {
    client: createClient<Database>(url, key),
    userId,
  };
}

/**
 * Create 3 test products with nutrition data
 * @returns Promise<string[]> - Array of created product IDs
 */
export async function createTestProducts(): Promise<string[]> {
  const { client } = createSupabaseClient();

  const { data, error } = await client.from("products").insert(SEEDED_PRODUCTS).select("id");

  if (error || !data) {
    throw new Error(`Failed to create test products: ${error?.message}`);
  }

  const productIds = data.map((p) => p.id);
  testData.productIds.push(...productIds);

  return productIds;
}

/**
 * Create 3 entries attached to 3 different products
 * @param productIds - Array of product IDs to attach entries to
 * @returns Promise<string[]> - Array of created entry IDs
 */
export async function createTestEntries(productIds: string[]): Promise<string[]> {
  if (productIds.length < 3) {
    throw new Error("Need at least 3 product IDs to create test entries");
  }

  const { client, userId } = createSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  const entries: EntryInsert[] = [
    {
      product_id: productIds[0],
      user_id: userId,
      quantity: SEEDED_ENTRY_QUANTITIES[0],
      consumed_at: today,
    },
    {
      product_id: productIds[1],
      user_id: userId,
      quantity: SEEDED_ENTRY_QUANTITIES[1],
      consumed_at: today,
    },
    {
      product_id: productIds[2],
      user_id: userId,
      quantity: SEEDED_ENTRY_QUANTITIES[2],
      consumed_at: today,
    },
  ];

  const { data, error } = await client.from("entries").insert(entries).select("id");

  if (error || !data) {
    throw new Error(`Failed to create test entries: ${error?.message}`);
  }

  const entryIds = data.map((e) => e.id);
  testData.entryIds.push(...entryIds);

  return entryIds;
}

/**
 * Delete all created test entries
 */
export async function deleteTestEntries(): Promise<void> {
  if (testData.entryIds.length === 0) {
    return;
  }

  const { client } = createSupabaseClient();

  const { error } = await client.from("entries").delete().in("id", testData.entryIds);

  if (error) {
    // eslint-disable-next-line no-console
    console.warn(`Warning: Failed to delete test entries: ${error.message}`);
  }

  testData.entryIds = [];
}

/**
 * Delete all created test products
 */
export async function deleteTestProducts(): Promise<void> {
  if (testData.productIds.length === 0) {
    return;
  }

  const { client } = createSupabaseClient();

  const { error } = await client.from("products").delete().in("id", testData.productIds);

  if (error) {
    // eslint-disable-next-line no-console
    console.warn(`Warning: Failed to delete test products: ${error.message}`);
  }

  testData.productIds = [];
}

/**
 * Complete setup: Create products and entries for testing
 * @returns Promise with productIds and entryIds
 */
export async function setupTestData(): Promise<{
  productIds: string[];
  entryIds: string[];
}> {
  // eslint-disable-next-line no-console
  console.log("📋 Setting up test data...");

  const productIds = await createTestProducts();
  // eslint-disable-next-line no-console
  console.log(`✅ Created ${productIds.length} test products`);

  const entryIds = await createTestEntries(productIds);
  // eslint-disable-next-line no-console
  console.log(`✅ Created ${entryIds.length} test entries`);

  return { productIds, entryIds };
}

/**
 * Complete teardown: Delete all created entries and products
 */
export async function teardownTestData(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("🧹 Cleaning up test data...");

  // Delete entries first (they have foreign key to products)
  await deleteTestEntries();
  // eslint-disable-next-line no-console
  console.log("✅ Deleted test entries");

  // Then delete products
  await deleteTestProducts();
  // eslint-disable-next-line no-console
  console.log("✅ Deleted test products");
}
