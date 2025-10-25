# View Implementation Plan: Dashboard View

## 1. Overview

The Dashboard view displays the user’s daily summary of calories and macronutrients alongside controls to refresh data, adjust the daily goal, and log out. It visualizes progress toward the daily caloric goal using a progress bar and presents protein, fat, and carbohydrate totals.

## 2. View Routing

- Route path: `/dashboard`
- Astro page: `src/pages/dashboard.astro`

## 3. Component Structure

```
DashboardPage (Astro)
├─ Header
│  ├─ SettingsIcon (opens SettingsModal)
│  └─ LogoutButton
└─ DashboardContent
   ├─ (loading) Spinner
   ├─ (error) ErrorAlert
   └─ (success)
      ├─ SummaryPanel
      │  ├─ ProgressBar
      │  └─ NutrientStats
      └─ RefreshButton

SettingsModal (Dialog)
```

## 4. Component Details

### DashboardPage

- Description: Astro page that wraps `Layout.astro`, renders `Header` and `DashboardContent`.
- Main elements: `<Layout>` wrapper, two child React components.
- Events: None.
- Props: None.

### Header

- Description: Top bar with icons for opening settings and logging out.
- Elements:
  - SettingsIcon: Shadcn UI `DialogTrigger` wrapping a gear icon.
  - LogoutButton: Shadcn UI `Button` or icon button.
- Events:
  - onClick SettingsIcon → toggles `SettingsModal`.
  - onClick LogoutButton → calls `supabase.auth.signOut()` and redirects to login.
- Types: None.
- Props: None.

### DashboardContent

- Description: Contains data fetching logic and conditional rendering for loading, error, or success states.
- Elements & children:
  - Spinner: Shadcn UI `Spinner` while `loading === true`.
  - ErrorAlert: Shadcn UI `Alert` with retry button when `error` exists.
  - SummaryPanel + RefreshButton on successful fetch.
- Events:
  - onRetry (ErrorAlert) → calls `refetch()`.
  - onRefresh (RefreshButton) → calls `refetch()`.
- Validation: N/A at this level.
- Types:
  - Input: none
  - Consumes: `useSummary()` hook return types.
- Props: None.

### SummaryPanel

- Description: Displays total calories vs. goal and macronutrient breakdown.
- Elements:
  - ProgressBar: Shadcn UI `Progress` showing percentage `(calories / goal) * 100`.
  - NutrientStats: lists `protein`, `fat`, `carbs` in grams.
- Events: None.
- Validation:
  - If `goal === null`, show “Goal not set” and hide progress bar.
- Types:
  - Props interface: `summary: SummaryVM`.

### NutrientStats

- Description: Renders three key-value pairs for `protein`, `fat`, and `carbs`.
- Elements: three columns or flex items with nutrient name and gram value.
- Events: None.
- Validation: Values are non-negative numbers (guaranteed by API).
- Types:
  - Props: `{ protein: number; fat: number; carbs: number; }`.

### RefreshButton

- Description: Button to manually refetch summary data.
- Elements: Shadcn UI `Button` labeled “Refresh”.
- Events:
  - onClick → `refetch()` from hook.
- Props: `{ disabled: boolean; onClick: () => void; }`.

### ErrorAlert

- Description: Inline alert with error message and a retry action.
- Elements: Shadcn UI `Alert`, `AlertDescription`, `AlertAction` (retry link/button).
- Events:
  - onActionClick → `refetch()`.
- Types:
  - Props: `{ message: string; onRetry: () => void; }`.

### SettingsModal

- Description: Dialog for viewing/updating daily calorie goal.
- Elements: Shadcn UI `Dialog`, `DialogTrigger`, `DialogContent` containing:
  - Form with numeric input for `dailyCalorieGoal`.
  - Save button.
- Events:
  - onOpen: focus the input.
  - onSubmit: POST `/api/user-goals` with `{ dailyCalorieGoal }`, then `refetch()` summary and close dialog.
- Validation:
  - Input is required, positive integer > 0.
- Types:
  - Props: none.
  - Local: `UpsertUserGoalCommand { dailyCalorieGoal: number }`.

### LogoutButton

- Description: Button to sign out the user.
- Elements: Shadcn UI icon or text button.
- Events:
  - onClick → `supabase.auth.signOut()` then redirect.
- Types: None.

## 5. Types

- `SummaryResponseDto` = `DailySummaryDto` from backend: `{ calories: number; protein: number; fat: number; carbs: number; goal: number | null; }`.
- `SummaryVM`:
  ```ts
  interface SummaryVM {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    goal: number | null;
    progress?: number; // percentage (0–100) or undefined if goal null
  }
  ```
- `UpsertUserGoalCommand`: `{ dailyCalorieGoal: number }` (carries goal to API).
- `UseSummaryHookResult`:
  ```ts
  interface UseSummaryHookResult {
    data?: SummaryVM;
    loading: boolean;
    error?: Error;
    refetch: () => void;
  }
  ```

## 6. State Management

- Custom hook `useSummary()`:
  - Calls `GET /api/summary` on mount.
  - Manages `data`, `loading`, `error`, `refetch()`.
  - Transforms `SummaryResponseDto` → `SummaryVM` (compute `progress`).
- Local state in `SettingsModal`:
  - `dailyCalorieGoal` form state.
  - `isOpen` dialog state.

## 7. API Integration

- Fetch summary:
  ```ts
  GET / api / summary;
  Response: SummaryResponseDto;
  ```
- Save goal:
  ```ts
  POST / api / user - goals;
  Body: UpsertUserGoalCommand;
  ```
- Use native `fetch` or a lightweight client; attach authorization via Supabase client.

## 8. User Interactions

1. **Page load**: Spinner until `loading` false. On success, display `SummaryPanel`; on error, show `ErrorAlert`.
2. **Refresh**: Click `RefreshButton`, spinner → same flow as initial load.
3. **Error retry**: Click retry in `ErrorAlert` to re-trigger fetch.
4. **Settings**: Click settings icon → open `SettingsModal`; update goal, click Save → POST, close modal, re-fetch → update UI.
5. **Logout**: Click `LogoutButton` → sign out and navigate to login.

## 9. Conditions and Validation

- **Goal null**: Hide progress bar; show message “Goal not set.”
- **Input validation**: In `SettingsModal`, ensure `dailyCalorieGoal` > 0; disable Save if invalid.
- **Disable controls**: While `loading`, disable Refresh and Settings triggers.

## 10. Error Handling

- **Network or 500**: Show `ErrorAlert` with generic “Failed to load summary. Retry?”
- **401 Unauthorized**: On fetch 401, call `supabase.auth.signOut()` and redirect to `/login`.
- **Invalid goal save**: If save endpoint fails, show inline form error in modal.

## 11. Implementation Steps

1. Define `SummaryVM` and `UseSummaryHookResult` in `src/types.ts` or `src/lib/hooks.ts`.
2. Implement `useSummary()` hook in `src/lib/hooks/useSummary.ts`.
3. Create `SummaryPanel.tsx` in `src/components/dashboard/`.
4. Create `NutrientStats.tsx` alongside `SummaryPanel`.
5. Implement `DashboardContent.tsx` to orchestrate loading, error, and success states.
6. Create `SettingsModal.tsx` with form and integrate goal upsert API.
7. Implement `Header.tsx` with `SettingsIcon` and `LogoutButton`.
8. Add `src/pages/dashboard.astro`, render `Header` and `DashboardContent` inside `Layout`.
9. Style all components with Tailwind and Shadcn/ui themes.
10. Test end-to-end flows: initial load, refresh, goal update, error scenarios, logout.
