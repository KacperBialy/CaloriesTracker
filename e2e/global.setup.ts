import { setupTestData } from "./helpers/testData";

/**
 * Global setup function runs once before all tests
 * Sets up test data (products and entries) in Supabase
 */
async function globalSetup() {
  try {
    const { productIds, entryIds } = await setupTestData();

    // Store data in environment for access in tests if needed
    process.env.TEST_PRODUCT_IDS = productIds.join(",");
    process.env.TEST_ENTRY_IDS = entryIds.join(",");

    // eslint-disable-next-line no-console
    console.log("\n✨ Global setup complete!");
    // eslint-disable-next-line no-console
    console.log(`   Products: ${productIds.join(", ")}`);
    // eslint-disable-next-line no-console
    console.log(`   Entries: ${entryIds.join(", ")}\n`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Global setup failed:", error);
    process.exit(1);
  }
}

export default globalSetup;
