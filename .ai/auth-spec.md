# Authentication Module - Technical Specification

This document outlines the technical architecture for the authentication module of the CaloriesTracker application. It covers user registration, login, logout, and password recovery functionalities, aligning with product requirements `US-001` and `US-007` from `prd.md`.

The architecture is designed for the following tech stack:

- Astro 5 (in SSR mode)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Shadcn/ui
- Supabase

## 1. User Interface Architecture

The frontend will be structured to clearly separate public-facing authentication pages from protected application pages.

### 1.1. Pages

- **`src/pages/index.astro`** (Homepage / Auth Page)
  - **Responsibility**: This will be the main entry point for unauthenticated users.
  - **Content**: It will render the `AuthForm` React component, which provides sign-in and sign-up functionality.
  - **Mode**: Public. If an authenticated user navigates here, middleware will redirect them to `/dashboard`.

- **`src/pages/dashboard.astro`**
  - **Responsibility**: Displays the main application dashboard with calorie tracking information.
  - **Mode**: Protected. Access is restricted to authenticated users. Unauthenticated users will be redirected to `/`.

- **`src/pages/update-password.astro`**
  - **Responsibility**: A dedicated page for users to set a new password after initiating the password recovery process.
  - **Content**: It will render the `UpdatePasswordForm` React component.
  - **Mode**: Public.

### 1.2. Layouts

- **`src/layouts/BaseLayout.astro`**
  - **Usage**: Applied to all public pages (`/`, `/update-password`).
  - **Features**: Provides a minimal layout, typically centered, suitable for displaying authentication forms.

- **`src/layouts/DashboardLayout.astro`**
  - **Usage**: Wraps all protected pages (`/dashboard`).
  - **Features**: Contains the main application navigation, including user profile information and a `LogoutButton`. It may fetch user-specific data that is common across all protected pages.

### 1.3. Components (React)

- **`src/components/auth/AuthForm.tsx`**
  - **Description**: A client-side component providing a tabbed interface for "Sign In" and "Sign Up".
  - **State Management**: Manages form inputs (email, password), submission state (loading), and error messages.
  - **Interaction**:
    - On submit, it makes a `POST` request to the corresponding API endpoint (`/api/auth/login` or `/api/auth/register`).
    - Displays validation errors (e.g., "Invalid email format") and server errors (e.g., "Invalid credentials").
    - Upon successful login/registration, the page will be reloaded, and Astro's middleware will handle redirection to `/dashboard`.
  - **UI**: Built using `shadcn/ui` components (`Card`, `Tabs`, `Input`, `Button`).

- **`src/components/auth/UpdatePasswordForm.tsx`**
  - **Description**: Handles the final step of the password recovery flow.
  - **Interaction**:
    - On page load, it uses the Supabase client-side library to detect the password recovery token from the URL hash.
    - It presents the user with a form to enter and confirm a new password.
    - On submit, it uses `supabase.auth.updateUser()` to set the new password.
    - Displays success or error messages to the user.

- **`src/components/auth/LogoutButton.tsx`**
  - **Description**: A simple component, likely in the header of `DashboardLayout.astro`.
  - **Interaction**: Renders a form with a single button that, when clicked, sends a `POST` request to `/api/auth/logout`. The browser will follow the redirect response.

### 1.4. Key Scenarios

- **New User Registration**: User fills out the "Sign Up" form on `/`. The form `POST`s to `/api/auth/register`. After successful registration and email confirmation, the user can log in.
- **User Login**: User fills out the "Sign In" form on `/`. The form `POST`s to `/api/auth/login`. On success, the server sets a session cookie, and the user is redirected to `/dashboard`.
- **Accessing Protected Route**: An unauthenticated user visiting `/dashboard` is intercepted by middleware and redirected to `/`.
- **Password Recovery**:
  1. User enters their email in a "Forgot Password?" link/modal in `AuthForm.tsx`.
  2. A `POST` request is sent to `/api/auth/forgot-password`.
  3. User receives an email with a link to `/update-password`.
  4. User clicks the link, enters a new password in `UpdatePasswordForm.tsx`, and submits to update their credentials.

## 2. Backend Logic

The backend relies on Astro's SSR capabilities to handle authentication state and API requests.

### 2.1. Astro Configuration (`astro.config.mjs`)

- **Mode**: The application must be configured to run in server-side rendering mode (`output: 'server'`). This is essential for middleware, API endpoints, and server-side session management.

### 2.2. API Endpoints

A single dynamic API route will handle all authentication actions.

- **`src/pages/api/auth/[action].ts`**
  - This route will handle different actions based on the `action` parameter in the URL.
  - **`POST /api/auth/login`**
    - **Request Body**: `{ email: string, password: string }`
    - **Logic**: Calls `supabase.auth.signInWithPassword()`. If successful, it sets the session cookies on the response header.
    - **Response**: `200 OK` on success, `401 Unauthorized` on failure with a JSON error message.
  - **`POST /api/auth/register`**
    - **Request Body**: `{ email: string, password: string }`
    - **Logic**: Calls `supabase.auth.signUp()`. Supabase will handle sending a confirmation email.
    - **Response**: `201 Created` on success, `400 Bad Request` if the user already exists or data is invalid.
  - **`POST /api/auth/logout`**
    - **Request Body**: Empty
    - **Logic**: Calls `supabase.auth.signOut()`. It clears the session cookies.
    - **Response**: `302 Found` redirecting to `/`.
  - **`POST /api/auth/forgot-password`**
    - **Request Body**: `{ email: string }`
    - **Logic**: Calls `supabase.auth.resetPasswordForEmail()`, specifying `redirectTo` to be the URL of the `update-password` page.
    - **Response**: `200 OK` on success.

### 2.3. Middleware (`src/middleware/index.ts`)

- **Responsibility**: To protect routes and manage redirection based on authentication state.
- **Logic**:
  1. Executes on every server request.
  2. Creates a server-side Supabase client using cookies from the request.
  3. Fetches the current user session.
  4. **Route Protection**:
     - If the user is trying to access a protected path (e.g., `/dashboard/*`) and has no session, redirect to `/`.
     - If the user is on a public auth path (e.g., `/`) and _has_ a session, redirect to `/dashboard`.
  5. Passes user session data to pages via `context.locals` for use in server-side rendering logic.

### 2.4. Data Validation

- **Client-Side**: Implemented in React components for immediate user feedback (e.g., email format, password complexity).
- **Server-Side**: Implemented in the API endpoints using a library like `Zod` to validate the shape and content of the request body before processing. This ensures data integrity and security.

## 3. Authentication System (Supabase)

### 3.1. Supabase Client Setup

- **`src/db/supabase.ts`**:
  - A utility file will be created to manage Supabase client instances.
  - It will export a function that creates a server-side Supabase client from Astro's `APIContext`, allowing it to read and write auth cookies correctly. This is the primary way Supabase will be used on the backend.
- **Client-Side Instance**: A separate client-side Supabase instance will be created for use in React components, primarily for the password update flow.

### 3.2. Session Management

- Session management is handled primarily by Supabase via secure, `httpOnly` cookies.
- The server-side Supabase client, when created with the request's cookie context, will automatically manage the user's session state.
- The frontend does not need to store tokens manually; the browser handles the session cookies automatically.

### 3.3. Environment Variables

The following environment variables must be configured in a `.env` file:

- `SUPABASE_URL`: The URL of the Supabase project.
- `SUPABASE_ANON_KEY`: The public anonymous key for the Supabase project.
