import type { Page } from "@playwright/test";
import { AuthPage, DashboardPage } from "../pages";

/**
 * Helper function to sign in a user using Page Object Model
 */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  const authPage = new AuthPage(page);
  await authPage.goto();
  await authPage.signIn(email, password);
  await authPage.waitForDashboardRedirect();
}

/**
 * Helper function to sign in with environment variable credentials
 * Clears cookies and logs in using E2E_USERNAME and E2E_PASSWORD
 */
export async function signInWithEnv(page: Page): Promise<void> {
  // Clear any existing authentication state
  await page.context().clearCookies();

  // Use environment variables for test credentials
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!username || !password) {
    throw new Error("E2E_USERNAME or E2E_PASSWORD is not set");
  }

  await signIn(page, username, password);
}

/**
 * Helper function to sign out a user using Page Object Model
 */
export async function signOut(page: Page): Promise<void> {
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.goto();
  await dashboardPage.logout();
}
