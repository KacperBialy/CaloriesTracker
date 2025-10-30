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
 * Helper function to sign out a user using Page Object Model
 */
export async function signOut(page: Page): Promise<void> {
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.goto();
  await dashboardPage.logout();
}

/**
 * Helper function to create a test user via API
 * Use this in beforeAll hooks to set up test data
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function createTestUser(email: string, password: string): Promise<void> {
  // Implement user creation via API
  // This should use your backend API to create a test user
  // Example:
  // const response = await fetch('http://localhost:4321/api/auth/register', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email, password }),
  // });
  // if (!response.ok) {
  //   throw new Error(`Failed to create test user: ${await response.text()}`);
  // }
}
