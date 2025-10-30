import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");

    // Check that the page loaded successfully
    await expect(page).toHaveTitle(/CaloriesTracker|10x/i);
  });

  test("should have navigation elements", async ({ page }) => {
    await page.goto("/");

    // Add checks for navigation elements once implemented
    // This is a placeholder example
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Authentication Flow", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to home or login page
    await page.waitForURL("/", { timeout: 5000 }).catch(() => {
      // If doesn't redirect, we might already be at login
    });

    // Verify we're not on dashboard without auth
    const url = page.url();
    expect(url).not.toContain("/dashboard");
  });
});
