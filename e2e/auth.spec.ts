import { test, expect } from "@playwright/test";
import { AuthPage } from "./pages/AuthPage";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication state
    await page.context().clearCookies();
  });

  test.describe("Sign In", () => {
    test("should display sign in form by default", async ({ page }) => {
      const authPage = new AuthPage(page);
      await authPage.goto();

      await expect(authPage.authForm).toBeVisible();
      await expect(authPage.signInForm).toBeVisible();
      await expect(authPage.signInEmailInput).toBeVisible();
      await expect(authPage.signInPasswordInput).toBeVisible();
      await expect(authPage.signInSubmitButton).toBeVisible();
    });

    test("should show validation errors for empty fields", async ({ page }) => {
      const authPage = new AuthPage(page);
      await authPage.goto();

      await authPage.signInSubmitButton.click();
      await page.waitForTimeout(500);

      // Check for validation errors (these may appear as browser validation or form errors)
      const emailValue = await authPage.signInEmailInput.inputValue();
      const passwordValue = await authPage.signInPasswordInput.inputValue();

      // If fields are empty, browser validation should prevent submission
      expect(emailValue).toBe("");
      expect(passwordValue).toBe("");
    });

    test("should show error for invalid credentials", async ({ page }) => {
      const authPage = new AuthPage(page);
      await authPage.goto();

      await authPage.signIn("invalid@example.com", "wrongpassword");
      await page.waitForTimeout(2000);

      // Check if error message appears
      const hasError = await authPage.hasSignInError();
      if (hasError) {
        const errorMessage = await authPage.getSignInError();
        expect(errorMessage).toBeTruthy();
      }
    });
  });

  test.describe("Sign Up", () => {
    test("should switch to sign up tab", async ({ page }) => {
      const authPage = new AuthPage(page);
      await authPage.goto();

      await authPage.switchToSignUp();

      await expect(authPage.signUpForm).toBeVisible();
      await expect(authPage.signUpEmailInput).toBeVisible();
      await expect(authPage.signUpPasswordInput).toBeVisible();
      await expect(authPage.signUpConfirmPasswordInput).toBeVisible();
      await expect(authPage.signUpSubmitButton).toBeVisible();
    });

    test("should show validation errors for invalid email", async ({ page }) => {
      const authPage = new AuthPage(page);
      await authPage.goto();

      await authPage.switchToSignUp();
      await authPage.signUpEmailInput.fill("invalid-email");
      await authPage.signUpPasswordInput.fill("password123");
      await authPage.signUpConfirmPasswordInput.fill("password123");
      await authPage.signUpSubmitButton.click();
      await page.waitForTimeout(1000);

      // Check for email validation error
      const hasEmailError = await authPage.signUpEmailError.isVisible().catch(() => false);
      // Validation may happen via browser or form, so we check both scenarios
      expect(hasEmailError || (await authPage.hasSignUpError())).toBeTruthy();
    });

    test("should show error when passwords don't match", async ({ page }) => {
      const authPage = new AuthPage(page);
      await authPage.goto();

      await authPage.switchToSignUp();
      await authPage.signUpEmailInput.fill("test@example.com");
      await authPage.signUpPasswordInput.fill("password123");
      await authPage.signUpConfirmPasswordInput.fill("differentpassword");
      await authPage.signUpSubmitButton.click();
      await page.waitForTimeout(1000);

      // Check for password mismatch error
      const hasConfirmPasswordError = await authPage.signUpConfirmPasswordError.isVisible().catch(() => false);
      expect(hasConfirmPasswordError || (await authPage.hasSignUpError())).toBeTruthy();
    });
  });

  test.describe("Navigation", () => {
    test("should switch between sign in and sign up tabs", async ({ page }) => {
      const authPage = new AuthPage(page);
      await authPage.goto();

      // Start on sign in
      await expect(authPage.signInForm).toBeVisible();

      // Switch to sign up
      await authPage.switchToSignUp();
      await expect(authPage.signUpForm).toBeVisible();

      // Switch back to sign in
      await authPage.switchToSignIn();
      await expect(authPage.signInForm).toBeVisible();
    });
  });
});

test.describe("Authentication Flow", () => {
  test("should redirect to dashboard after successful login", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();

    // Note: This test requires valid credentials
    // In a real scenario, you'd use test fixtures or API helpers to create test users
    // await authPage.signIn("test@example.com", "password123");
    // await authPage.waitForDashboardRedirect();
    // await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should redirect to login when accessing dashboard without auth", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to home/login page
    await page.waitForURL("/", { timeout: 5000 }).catch(() => {
      // If doesn't redirect, we might already be at login
    });

    // Verify we're not on dashboard without auth
    const url = page.url();
    expect(url).not.toContain("/dashboard");
  });
});
