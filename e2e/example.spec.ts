import { test, expect } from "@playwright/test";
import { AuthPage } from "./pages/AuthPage";

test.describe("Homepage", () => {
  test("should load the homepage with auth form", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();

    // Check that the page loaded successfully
    await expect(page).toHaveTitle(/CaloriesTracker|10x/i);

    // Verify auth form is visible
    await expect(authPage.authForm).toBeVisible();
    await expect(authPage.signInForm).toBeVisible();
  });

  test("should display sign in form by default", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();

    // Verify sign in form elements are visible
    await expect(authPage.signInEmailInput).toBeVisible();
    await expect(authPage.signInPasswordInput).toBeVisible();
    await expect(authPage.signInSubmitButton).toBeVisible();
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

  test("should display auth form when accessing protected route", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait for redirect
    await page.waitForURL("/", { timeout: 5000 });

    // Verify auth form is displayed
    const authPage = new AuthPage(page);
    await expect(authPage.authForm).toBeVisible();
  });
});
