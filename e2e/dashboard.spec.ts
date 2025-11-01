import { test, expect } from "@playwright/test";
import { DashboardPage } from "./pages/DashboardPage";
import { signInWithEnv } from "./helpers/auth";

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
    test.beforeEach(async ({ page }) => {
      await signInWithEnv(page);
    });

    test("should display dashboard header", async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();

      await expect(dashboardPage.dashboardHeader).toBeVisible();
      await expect(dashboardPage.headerSettingsButton).toBeVisible();
      await expect(dashboardPage.headerLogoutButton).toBeVisible();
    });

    test("should display summary panel when data loads", async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.waitForDashboardLoad();

      await expect(dashboardPage.summaryPanel).toBeVisible();
      await expect(dashboardPage.summaryPanelCalories).toBeVisible();
    });

    test("should open and close settings modal", async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.waitForDashboardLoad();

      await dashboardPage.openSettings();
      await expect(dashboardPage.settingsModal).toBeVisible();
      await expect(dashboardPage.settingsModalGoalInput).toBeVisible();

      await dashboardPage.closeSettings();
      await expect(dashboardPage.settingsModal).not.toBeVisible();
    });

    test("should update daily calorie goal", async ({ page }) => {
      const randomGoal = Math.floor(Math.random() * 2000 + 3000).toString();

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.waitForDashboardLoad();

      await dashboardPage.openSettings();
      await dashboardPage.settingsModalGoalInput.fill(randomGoal);
      await dashboardPage.settingsModalSave.click();
      await page.waitForTimeout(1000);

      // Modal should close after successful save
      await expect(dashboardPage.settingsModal).not.toBeVisible();
      await expect(dashboardPage.summaryPanelCaloriesValue).toContainText(randomGoal);
    });

    test("should logout successfully", async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.waitForDashboardLoad();

      await dashboardPage.logout();
      await expect(page).toHaveURL("/");
    });

    test("should refresh dashboard data", async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.waitForDashboardLoad();

      await dashboardPage.refresh();
      // Should still be on dashboard after refresh
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test("should display consumed products list", async ({ page }) => {
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
