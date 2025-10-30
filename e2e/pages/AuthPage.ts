import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for the Authentication page
 * Handles login and signup flows
 */
export class AuthPage extends BasePage {
  // Main form container
  readonly authForm: Locator;

  // Tab buttons
  readonly signInTab: Locator;
  readonly signUpTab: Locator;

  // Sign In form elements
  readonly signInForm: Locator;
  readonly signInEmailInput: Locator;
  readonly signInPasswordInput: Locator;
  readonly signInSubmitButton: Locator;
  readonly signInError: Locator;
  readonly signInEmailError: Locator;
  readonly signInPasswordError: Locator;

  // Sign Up form elements
  readonly signUpForm: Locator;
  readonly signUpEmailInput: Locator;
  readonly signUpPasswordInput: Locator;
  readonly signUpConfirmPasswordInput: Locator;
  readonly signUpSubmitButton: Locator;
  readonly signUpError: Locator;
  readonly signUpSuccess: Locator;
  readonly signUpEmailError: Locator;
  readonly signUpPasswordError: Locator;
  readonly signUpConfirmPasswordError: Locator;

  constructor(page: Page) {
    super(page);

    // Main form
    this.authForm = this.getByTestId("auth-form");

    // Tabs
    this.signInTab = this.getByTestId("auth-form-signin-tab");
    this.signUpTab = this.getByTestId("auth-form-signup-tab");

    // Sign In form
    this.signInForm = this.getByTestId("signin-form");
    this.signInEmailInput = this.getByTestId("signin-form-email");
    this.signInPasswordInput = this.getByTestId("signin-form-password");
    this.signInSubmitButton = this.getByTestId("signin-form-submit");
    this.signInError = this.getByTestId("signin-form-error");
    this.signInEmailError = this.getByTestId("signin-form-email-error");
    this.signInPasswordError = this.getByTestId("signin-form-password-error");

    // Sign Up form
    this.signUpForm = this.getByTestId("signup-form");
    this.signUpEmailInput = this.getByTestId("signup-form-email");
    this.signUpPasswordInput = this.getByTestId("signup-form-password");
    this.signUpConfirmPasswordInput = this.getByTestId("signup-form-confirm-password");
    this.signUpSubmitButton = this.getByTestId("signup-form-submit");
    this.signUpError = this.getByTestId("signup-form-error");
    this.signUpSuccess = this.getByTestId("signup-form-success");
    this.signUpEmailError = this.getByTestId("signup-form-email-error");
    this.signUpPasswordError = this.getByTestId("signup-form-password-error");
    this.signUpConfirmPasswordError = this.getByTestId("signup-form-confirm-password-error");
  }

  /**
   * Navigate to the auth page
   */
  async goto(): Promise<void> {
    await super.goto("/");
    await this.waitForLoad();
    await this.authForm.waitFor({ state: "visible" });
  }

  /**
   * Switch to Sign In tab
   */
  async switchToSignIn(): Promise<void> {
    await this.signInTab.click();
    await this.signInForm.waitFor({ state: "visible" });
  }

  /**
   * Switch to Sign Up tab
   */
  async switchToSignUp(): Promise<void> {
    await this.signUpTab.click();
    await this.signUpForm.waitFor({ state: "visible" });
  }

  /**
   * Fill and submit the sign in form
   */
  async signIn(email: string, password: string): Promise<void> {
    await this.switchToSignIn();
    await this.signInEmailInput.fill(email);
    await this.signInPasswordInput.fill(password);
    await this.signInSubmitButton.click();
    // Wait for navigation or error message
    await this.page.waitForTimeout(1000);
  }

  /**
   * Fill and submit the sign up form
   */
  async signUp(email: string, password: string, confirmPassword?: string): Promise<void> {
    await this.switchToSignUp();
    await this.signUpEmailInput.fill(email);
    await this.signUpPasswordInput.fill(password);
    await this.signUpConfirmPasswordInput.fill(confirmPassword || password);
    await this.signUpSubmitButton.click();
    // Wait for success message or error
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check if sign in error is visible
   */
  async hasSignInError(): Promise<boolean> {
    return await this.signInError.isVisible().catch(() => false);
  }

  /**
   * Get sign in error message
   */
  async getSignInError(): Promise<string> {
    return (await this.signInError.textContent()) || "";
  }

  /**
   * Check if sign up error is visible
   */
  async hasSignUpError(): Promise<boolean> {
    return await this.signUpError.isVisible().catch(() => false);
  }

  /**
   * Get sign up error message
   */
  async getSignUpError(): Promise<string> {
    return (await this.signUpError.textContent()) || "";
  }

  /**
   * Check if sign up success message is visible
   */
  async hasSignUpSuccess(): Promise<boolean> {
    return await this.signUpSuccess.isVisible().catch(() => false);
  }

  /**
   * Get sign up success message
   */
  async getSignUpSuccess(): Promise<string> {
    return (await this.signUpSuccess.textContent()) || "";
  }

  /**
   * Wait for redirect to dashboard after successful login
   */
  async waitForDashboardRedirect(): Promise<void> {
    await this.page.waitForURL(/\/dashboard/, { timeout: 10000 });
  }
}
