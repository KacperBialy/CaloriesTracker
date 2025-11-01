import { teardownTestData } from "./helpers/testData";

/**
 * Global teardown function runs once after all tests
 * Cleans up test data (entries and products) from Supabase
 */
async function globalTeardown() {
  try {
    await teardownTestData();
    // eslint-disable-next-line no-console
    console.log("\n✨ Global teardown complete!\n");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Global teardown failed:", error);
    // Don't exit with error as tests have already completed
  }
}

export default globalTeardown;
