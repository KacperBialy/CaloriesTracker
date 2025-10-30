import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for the Dashboard page
 * Handles dashboard interactions and assertions
 */
export class DashboardPage extends BasePage {
  // Main containers
  readonly dashboardPage: Locator;
  readonly dashboardHeader: Locator;
  readonly dashboardContent: Locator;

  // Header elements
  readonly headerSettingsButton: Locator;
  readonly headerLogoutButton: Locator;
  readonly headerAuthError: Locator;

  // Dashboard content
  readonly dashboardSpinner: Locator;
  readonly dashboardErrorAlert: Locator;
  readonly dashboardErrorRetryButton: Locator;
  readonly dashboardRefreshButton: Locator;

  // Summary Panel
  readonly summaryPanel: Locator;
  readonly summaryPanelCalories: Locator;
  readonly summaryPanelCaloriesValue: Locator;
  readonly summaryPanelProgress: Locator;
  readonly summaryPanelProgressText: Locator;
  readonly summaryPanelGoalNotSet: Locator;
  readonly summaryPanelMacronutrients: Locator;

  // Nutrient Stats
  readonly nutrientStats: Locator;
  readonly nutrientStatsProtein: Locator;
  readonly nutrientStatsProteinValue: Locator;
  readonly nutrientStatsFat: Locator;
  readonly nutrientStatsFatValue: Locator;
  readonly nutrientStatsCarbs: Locator;
  readonly nutrientStatsCarbsValue: Locator;

  // Consumed Products List
  readonly consumedProductsList: Locator;
  readonly consumedProductsListLoading: Locator;
  readonly consumedProductsListError: Locator;
  readonly consumedProductsListErrorAlert: Locator;
  readonly consumedProductsListEmpty: Locator;
  readonly consumedProductsListTableContainer: Locator;

  // Settings Modal
  readonly settingsModal: Locator;
  readonly settingsModalForm: Locator;
  readonly settingsModalGoalInput: Locator;
  readonly settingsModalError: Locator;
  readonly settingsModalCancel: Locator;
  readonly settingsModalSave: Locator;

  // Delete Modal
  readonly deleteModal: Locator;
  readonly deleteModalError: Locator;
  readonly deleteModalCancel: Locator;
  readonly deleteModalConfirm: Locator;

  constructor(page: Page) {
    super(page);

    // Main containers
    this.dashboardPage = this.getByTestId("dashboard-page");
    this.dashboardHeader = this.getByTestId("dashboard-header");
    this.dashboardContent = this.getByTestId("dashboard-content");

    // Header
    this.headerSettingsButton = this.getByTestId("dashboard-header-settings-button");
    this.headerLogoutButton = this.getByTestId("dashboard-header-logout-button");
    this.headerAuthError = this.getByTestId("dashboard-header-auth-error");

    // Dashboard content
    this.dashboardSpinner = this.getByTestId("dashboard-content-spinner");
    this.dashboardErrorAlert = this.getByTestId("dashboard-content-error-alert");
    this.dashboardErrorRetryButton = this.getByTestId("dashboard-content-error-retry-button");
    this.dashboardRefreshButton = this.getByTestId("dashboard-content-refresh-button");

    // Summary Panel
    this.summaryPanel = this.getByTestId("summary-panel");
    this.summaryPanelCalories = this.getByTestId("summary-panel-calories");
    this.summaryPanelCaloriesValue = this.getByTestId("summary-panel-calories-value");
    this.summaryPanelProgress = this.getByTestId("summary-panel-progress");
    this.summaryPanelProgressText = this.getByTestId("summary-panel-progress-text");
    this.summaryPanelGoalNotSet = this.getByTestId("summary-panel-goal-not-set");
    this.summaryPanelMacronutrients = this.getByTestId("summary-panel-macronutrients");

    // Nutrient Stats
    this.nutrientStats = this.getByTestId("nutrient-stats");
    this.nutrientStatsProtein = this.getByTestId("nutrient-stats-protein");
    this.nutrientStatsProteinValue = this.getByTestId("nutrient-stats-protein-value");
    this.nutrientStatsFat = this.getByTestId("nutrient-stats-fat");
    this.nutrientStatsFatValue = this.getByTestId("nutrient-stats-fat-value");
    this.nutrientStatsCarbs = this.getByTestId("nutrient-stats-carbs");
    this.nutrientStatsCarbsValue = this.getByTestId("nutrient-stats-carbs-value");

    // Consumed Products List
    this.consumedProductsList = this.getByTestId("consumed-products-list");
    this.consumedProductsListLoading = this.getByTestId("consumed-products-list-loading");
    this.consumedProductsListError = this.getByTestId("consumed-products-list-error");
    this.consumedProductsListErrorAlert = this.getByTestId("consumed-products-list-error-alert");
    this.consumedProductsListEmpty = this.getByTestId("consumed-products-list-empty");
    this.consumedProductsListTableContainer = this.getByTestId("consumed-products-list-table-container");

    // Settings Modal
    this.settingsModal = this.getByTestId("settings-modal");
    this.settingsModalForm = this.getByTestId("settings-modal-form");
    this.settingsModalGoalInput = this.getByTestId("settings-modal-goal-input");
    this.settingsModalError = this.getByTestId("settings-modal-error");
    this.settingsModalCancel = this.getByTestId("settings-modal-cancel");
    this.settingsModalSave = this.getByTestId("settings-modal-save");

    // Delete Modal
    this.deleteModal = this.getByTestId("consumed-products-list-delete-modal");
    this.deleteModalError = this.getByTestId("consumed-products-list-delete-modal-error");
    this.deleteModalCancel = this.getByTestId("consumed-products-list-delete-modal-cancel");
    this.deleteModalConfirm = this.getByTestId("consumed-products-list-delete-modal-confirm");
  }

  /**
   * Navigate to the dashboard page
   */
  async goto(): Promise<void> {
    await super.goto("/dashboard");
    await this.waitForLoad();
    await this.dashboardPage.waitFor({ state: "visible" });
  }

  /**
   * Wait for dashboard to load (wait for spinner to disappear)
   */
  async waitForDashboardLoad(): Promise<void> {
    // Wait for either data to load or error to appear
    await Promise.race([
      this.summaryPanel.waitFor({ state: "visible", timeout: 10000 }),
      this.dashboardErrorAlert.waitFor({ state: "visible", timeout: 10000 }),
      this.consumedProductsList.waitFor({ state: "visible", timeout: 10000 }),
    ]);
  }

  /**
   * Open settings modal
   */
  async openSettings(): Promise<void> {
    await this.headerSettingsButton.click();
    await this.settingsModal.waitFor({ state: "visible" });
  }

  /**
   * Close settings modal
   */
  async closeSettings(): Promise<void> {
    await this.settingsModalCancel.click();
    await this.settingsModal.waitFor({ state: "hidden" });
  }

  /**
   * Set daily calorie goal in settings
   */
  async setDailyGoal(goal: number): Promise<void> {
    await this.openSettings();
    await this.settingsModalGoalInput.fill(goal.toString());
    await this.settingsModalSave.click();
    // Wait for modal to close or error to appear
    await this.page.waitForTimeout(500);
  }

  /**
   * Logout from dashboard
   */
  async logout(): Promise<void> {
    await this.headerLogoutButton.click();
    // Wait for redirect to home page
    await this.page.waitForURL("/", { timeout: 5000 });
  }

  /**
   * Refresh dashboard data
   */
  async refresh(): Promise<void> {
    await this.dashboardRefreshButton.click();
    await this.waitForDashboardLoad();
  }

  /**
   * Retry loading after error
   */
  async retryAfterError(): Promise<void> {
    await this.dashboardErrorRetryButton.click();
    await this.waitForDashboardLoad();
  }

  /**
   * Get calories value from summary panel
   */
  async getCaloriesValue(): Promise<string> {
    return (await this.summaryPanelCaloriesValue.textContent()) || "";
  }

  /**
   * Get progress percentage
   */
  async getProgressPercentage(): Promise<number> {
    const text = (await this.summaryPanelProgressText.textContent()) || "";
    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Check if goal is set
   */
  async isGoalSet(): Promise<boolean> {
    const goalNotSetVisible = await this.summaryPanelGoalNotSet.isVisible().catch(() => false);
    return !goalNotSetVisible;
  }

  /**
   * Get nutrient value by name
   */
  async getNutrientValue(nutrient: "protein" | "fat" | "carbs"): Promise<number> {
    const locator = this.getByTestId(`nutrient-stats-${nutrient}-value`);
    const text = (await locator.textContent()) || "";
    return parseInt(text, 10) || 0;
  }

  /**
   * Get entry by entry ID
   */
  getEntry(entryId: string): Locator {
    return this.getByTestId(`consumed-products-list-entry-${entryId}`);
  }

  /**
   * Delete entry by entry ID
   */
  async deleteEntry(entryId: string): Promise<void> {
    const deleteButton = this.getByTestId(`consumed-products-list-delete-${entryId}`);
    await deleteButton.click();
    await this.deleteModal.waitFor({ state: "visible" });
    await this.deleteModalConfirm.click();
    // Wait for modal to close
    await this.deleteModal.waitFor({ state: "hidden" });
  }

  /**
   * Check if consumed products list is empty
   */
  async isEmpty(): Promise<boolean> {
    return await this.consumedProductsListEmpty.isVisible().catch(() => false);
  }

  /**
   * Check if dashboard is in loading state
   */
  async isLoading(): Promise<boolean> {
    return await this.dashboardSpinner.isVisible().catch(() => false);
  }

  /**
   * Check if dashboard has error
   */
  async hasError(): Promise<boolean> {
    return await this.dashboardErrorAlert.isVisible().catch(() => false);
  }
}
