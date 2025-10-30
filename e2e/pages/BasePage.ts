import type { Page, Locator } from "@playwright/test";

/**
 * Base Page Object Model class
 * Provides common functionality shared across all page objects
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   */
  async goto(path = "/"): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for the page to be loaded
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get a locator by data-test-id attribute
   */
  getByTestId(testId: string): Locator {
    return this.page.locator(`[data-test-id="${testId}"]`);
  }

  /**
   * Wait for an element with a specific test-id to be visible
   */
  async waitForTestId(testId: string, options?: { timeout?: number }): Promise<void> {
    await this.getByTestId(testId).waitFor({ state: "visible", timeout: options?.timeout });
  }

  /**
   * Get the current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for URL to match a pattern
   */
  async waitForURL(url: string | RegExp, options?: { timeout?: number }): Promise<void> {
    await this.page.waitForURL(url, { timeout: options?.timeout });
  }

  /**
   * Take a screenshot
   */
  async screenshot(options?: { path?: string; fullPage?: boolean }): Promise<Buffer> {
    return await this.page.screenshot(options);
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Check if an element is visible
   */
  async isVisible(testId: string): Promise<boolean> {
    return await this.getByTestId(testId)
      .isVisible()
      .catch(() => false);
  }

  /**
   * Check if an element exists in the DOM
   */
  async exists(testId: string): Promise<boolean> {
    const count = await this.getByTestId(testId).count();
    return count > 0;
  }
}
