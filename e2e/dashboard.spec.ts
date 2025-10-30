import { test, expect } from "@playwright/test";
import { DashboardPage } from "./pages/DashboardPage";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication state
    await page.context().clearCookies();
  });

  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to home/login page
    await page.waitForURL("/", { timeout: 5000 }).catch(() => {
      // If doesn't redirect, we might already be at login
    });

    const url = page.url();
    expect(url).not.toContain("/dashboard");
  });

  test.describe("Authenticated Dashboard", () => {
    // These tests require authentication
    // In a real scenario, you'd use test fixtures to set up authenticated sessions

    test.skip("should display dashboard header", async ({ page }) => {
      // Skip until authentication fixtures are set up
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();

      await expect(dashboardPage.dashboardHeader).toBeVisible();
      await expect(dashboardPage.headerSettingsButton).toBeVisible();
      await expect(dashboardPage.headerLogoutButton).toBeVisible();
    });

    test.skip("should display summary panel when data loads", async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.waitForDashboardLoad();

      await expect(dashboardPage.summaryPanel).toBeVisible();
      await expect(dashboardPage.summaryPanelCalories).toBeVisible();
    });

    test.skip("should open and close settings modal", async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.waitForDashboardLoad();

      await dashboardPage.openSettings();
      await expect(dashboardPage.settingsModal).toBeVisible();
      await expect(dashboardPage.settingsModalGoalInput).toBeVisible();

      await dashboardPage.closeSettings();
      await expect(dashboardPage.settingsModal).not.toBeVisible();
    });

    test.skip("should update daily calorie goal", async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.waitForDashboardLoad();

      await dashboardPage.openSettings();
      await dashboardPage.settingsModalGoalInput.fill("2000");
      await dashboardPage.settingsModalSave.click();
      await page.waitForTimeout(1000);

      // Modal should close after successful save
      await expect(dashboardPage.settingsModal).not.toBeVisible();
    });

    test.skip("should logout successfully", async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.waitForDashboardLoad();

      await dashboardPage.logout();
      await expect(page).toHaveURL("/");
    });

    test.skip("should refresh dashboard data", async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.waitForDashboardLoad();

      await dashboardPage.refresh();
      // Should still be on dashboard after refresh
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test.skip("should display consumed products list", async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.waitForDashboardLoad();

      // Check if list is visible (could be empty, loading, or have data)
      const isVisible = await dashboardPage.consumedProductsList.isVisible().catch(() => false);
      const isLoading = await dashboardPage.consumedProductsListLoading.isVisible().catch(() => false);
      const isEmpty = await dashboardPage.consumedProductsListEmpty.isVisible().catch(() => false);
      const hasError = await dashboardPage.consumedProductsListError.isVisible().catch(() => false);

      // At least one state should be true
      expect(isVisible || isLoading || isEmpty || hasError).toBeTruthy();
    });
  });
});

test.describe("Dashboard Visual Regression", () => {
  test.skip("should match dashboard screenshot", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.waitForDashboardLoad();

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot("dashboard.png", {
      fullPage: true,
    });
  });
});
