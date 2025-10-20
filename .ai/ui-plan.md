# UI Architecture for CaloriesTracker

## 1. UI Structure Overview

The MVP consists of a single authenticated dashboard screen rendered via Astro. Upon login (Google OAuth2), users are presented with a centered `SummaryPanel` React component inside a `max-w-4xl` container. Key interactions include manual data refresh, settings adjustment via a Shadcn UI `Dialog`, and inline error handling. The layout targets desktop viewports (≥1024px) and uses Tailwind’s default light theme with Shadcn UI components for accessibility and consistency.

## 2. View List

### 2.1. Login View
- Path: `/`
- Main purpose: Authenticate users via Google OAuth2
- Key information: “Sign in with Google” button, app logo, brief description
- Components:
  - Shadcn UI `Button` for Google sign-in
- Considerations: Prevent unauthorized access; redirect authenticated users to `/dashboard`.

### 2.2. Dashboard View
- Path: `/dashboard`
- Main purpose: Display daily summary of calories and macronutrients
- Key information:
  - Total calories consumed vs. goal (progress bar)
  - Total proteins, fats, carbohydrates in grams
  - “Refresh” button to refetch `/api/summary`
  - Settings icon (opens goal-update modal)
  - Logout icon/button
- Components:
  - `SummaryPanel` (React)
  - Shadcn UI `Progress` bar
  - Shadcn UI `Button` for refresh
  - Shadcn UI `Spinner` while loading
  - Inline Shadcn UI `Alert` with retry action
  - Header with icons (`Dialog` trigger, logout)
- Considerations:
  - Show spinner until data arrives; ensure keyboard focus management

### 2.3. Settings Modal
- Triggered from Dashboard header icon
- Main purpose: Create or update daily calorie goal via PUT `/api/user-goals`
- Key information:
  - Numeric input for daily goal
  - “Save” and “Cancel” buttons
  - Real-time validation (positive integer)
  - Success confirmation or inline error message
- Components:
  - Shadcn UI `Dialog`
  - Shadcn UI `Input` (type=number)
  - Shadcn UI `Button` (save, cancel)
  - Inline error text or `Alert` inside modal
- Considerations:
  - Disable Save until valid input
  - Feedback on API success/failure

## 3. User Journey Map

1. User visits `/` and clicks “Sign in with Google.”
2. Supabase OAuth flow authenticates and redirects to `/dashboard`.
3. `SummaryPanel` mounts and fetches `/api/summary`.
   - While loading: show spinner in panel.
   - On success: render progress bar and macros.
   - On failure: render inline alert with error text and “Retry” button.
4. User clicks Refresh → re-fetches summary (repeat spinner or alert). 
5. User clicks settings icon → opens modal.
6. User enters new calorie goal and clicks Save.
   - If input invalid: show validation error below input.
   - On API error: show inline alert in modal.
   - On success: close modal; prompt user to Refresh to see updated progress (or auto-refresh if decided).
7. User clicks Logout icon → clears session; returns to `/`.

## 4. Layout and Navigation Structure

- **Header (persistent on Dashboard):**
  - Left: App logo/title (accessible link to dashboard)
  - Right: [ Refresh button ] [ Settings icon ] [ Logout icon ]
- **Main Container:**
  - Centered `max-w-4xl` container
  - `SummaryPanel` occupies top of page
- **Routing:**
  - `/`: Login view
  - `/dashboard`: Dashboard view
- **Modal Navigation:**
  - Settings uses `Dialog`; no full-page navigation

## 5. Key Components

- **SummaryPanel.tsx**
  - Handles fetch logic via `useEffect` and local state
  - Renders spinner, progress, macros, and error alert
- **Shadcn UI Components**
  - `Button`, `Input`, `Dialog`, `Spinner`, `Progress`, `Alert`
  - Ensure ARIA attributes and focus management
- **Header Component**
  - Contains navigation icons and logout logic
  - Shared across authenticated pages

---

*This architecture aligns each user story from the PRD with UI elements and ensures a consistent, accessible, and secure user experience.*
