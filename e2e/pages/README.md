# Page Object Models

This directory contains Page Object Models (POMs) for Playwright E2E tests. The Page Object Model pattern encapsulates page-specific logic and elements, making tests more maintainable and readable.

## Structure

```
e2e/pages/
├── BasePage.ts      # Base class with common functionality
├── AuthPage.ts      # Authentication page (login/signup)
├── DashboardPage.ts # Dashboard page
└── index.ts         # Exports all page objects
```

## BasePage

The `BasePage` class provides common functionality used across all page objects:

- Navigation methods (`goto`, `waitForLoad`)
- Element selection by `data-test-id` (`getByTestId`, `waitForTestId`)
- Utility methods (`getUrl`, `waitForURL`, `screenshot`, `isVisible`, `exists`)

## Usage

### Basic Example

```typescript
import { test, expect } from "@playwright/test";
import { AuthPage } from "./pages/AuthPage";

test("should sign in successfully", async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.goto();
  await authPage.signIn("user@example.com", "password123");
  await authPage.waitForDashboardRedirect();

  expect(page.url()).toContain("/dashboard");
});
```

### Using DashboardPage

```typescript
import { DashboardPage } from "./pages/DashboardPage";

test("should update daily calorie goal", async ({ page }) => {
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.goto();
  await dashboardPage.waitForDashboardLoad();

  await dashboardPage.openSettings();
  await dashboardPage.setDailyGoal(2000);

  // Verify goal was set
  const isGoalSet = await dashboardPage.isGoalSet();
  expect(isGoalSet).toBe(true);
});
```

## Page Objects

### AuthPage

Handles authentication flows:

- `goto()` - Navigate to auth page
- `switchToSignIn()` / `switchToSignUp()` - Switch between tabs
- `signIn(email, password)` - Sign in with credentials
- `signUp(email, password, confirmPassword?)` - Sign up with credentials
- `waitForDashboardRedirect()` - Wait for redirect after login

### DashboardPage

Handles dashboard interactions:

- `goto()` - Navigate to dashboard
- `waitForDashboardLoad()` - Wait for dashboard to finish loading
- `openSettings()` / `closeSettings()` - Settings modal interactions
- `setDailyGoal(goal)` - Set daily calorie goal
- `logout()` - Logout from dashboard
- `refresh()` - Refresh dashboard data
- `getCaloriesValue()` - Get current calories value
- `getNutrientValue(nutrient)` - Get nutrient value (protein/fat/carbs)
- `deleteEntry(entryId)` - Delete a consumed product entry

## Best Practices

1. **Always use Page Objects in tests** - Don't interact with page elements directly
2. **Use data-test-id attributes** - All elements are accessed via `data-test-id` for resilience
3. **Wait for elements** - Use `waitFor()` methods to ensure elements are ready
4. **Keep Page Objects focused** - Each page object should only handle its own page
5. **Extend BasePage** - All page objects should extend `BasePage` for common functionality

## Adding New Page Objects

1. Create a new file in `e2e/pages/`
2. Extend `BasePage`
3. Define locators using `getByTestId()` in the constructor
4. Add methods for interactions and assertions
5. Export from `index.ts`

Example:

```typescript
import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class NewPage extends BasePage {
  readonly myElement: Locator;

  constructor(page: Page) {
    super(page);
    this.myElement = this.getByTestId("my-element");
  }

  async doSomething(): Promise<void> {
    await this.myElement.click();
  }
}
```
