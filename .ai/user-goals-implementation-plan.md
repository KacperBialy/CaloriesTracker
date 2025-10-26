# API Endpoint Implementation Plan: User Goals

## 1. Endpoint Overview
This plan outlines the implementation of the `/api/user-goals` REST API endpoint. This endpoint allows users to manage their daily calorie goals. It supports retrieving the current goal (`GET`) and creating or updating it (`PUT`).

## 2. Request Details

### Get User Goal
- **HTTP Method**: `GET`
- **URL Structure**: `/api/user-goals`
- **Parameters**: None
- **Request Body**: None

### Create/Update User Goal
- **HTTP Method**: `PUT`
- **URL Structure**: `/api/user-goals`
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "dailyCalorieGoal": number
  }
  ```

## 3. Used Types
The following types from `src/types.ts` will be used:
- **`UserGoalDto`**: Represents the response payload for a `GET` request.
- **`UpsertUserGoalCommand`**: Represents the request payload for a `PUT` request.
- **`UpsertUserGoalCommandSchema`**: A new Zod schema will be created to validate the `PUT` request body.

## 4. Response Details

### `GET /api/user-goals`
- **`200 OK`**: Successfully retrieved the user's goal.
  ```json
  {
    "dailyCalorieGoal": 2500
  }
  ```
- **`404 Not Found`**: The user has not set a goal yet.
- **`401 Unauthorized`**: The user is not authenticated.

### `PUT /api/user-goals`
- **`200 OK`**: Successfully created or updated the goal. The response body will be empty.
- **`400 Bad Request`**: The request body is invalid (e.g., non-positive `dailyCalorieGoal`).
- **`401 Unauthorized`**: The user is not authenticated.

## 5. Data Flow
1.  A client sends a request to the `/api/user-goals` endpoint.
2.  Astro's middleware intercepts the request to verify the user's session. If the user is not authenticated, it returns a `401 Unauthorized` error. The user session and Supabase client are attached to `context.locals`.
3.  The appropriate API route handler (`GET` or `PUT`) is invoked.
4.  For `PUT` requests, the handler validates the request body using the `UpsertUserGoalCommandSchema` Zod schema.
5.  The handler instantiates and calls the `UserGoalService` with the authenticated `user_id`.
6.  The `UserGoalService` executes the necessary database query (SELECT or UPSERT) on the `user_goals` table using the Supabase client.
7.  The service returns the result to the handler.
8.  The handler formats the HTTP response with the appropriate status code and payload and sends it back to the client.

## 6. Security Considerations
- **Authentication**: Access to the endpoint is restricted to authenticated users. The middleware will reject any requests without a valid session.
- **Authorization**: All database operations in `UserGoalService` must be scoped by the `user_id` from the authenticated session to prevent users from accessing or modifying other users' data.
- **Input Validation**: The `PUT` handler will use Zod for strict server-side validation of the request body to prevent invalid data from reaching the database.

## 7. Performance Considerations
- **Database Indexing**: The `user_id` column in the `user_goals` table has a `UNIQUE` constraint, which automatically creates an index. This ensures fast lookups.
- **Payload Size**: The request and response payloads are very small, minimizing network latency.
- **Rate Limiting**: To prevent abuse, rate limiting could be added to the `PUT` endpoint in the future if necessary.

## 8. Implementation Steps

1.  **Update `src/types.ts`**
    -   Add `UpsertUserGoalCommandSchema` using Zod to validate that `dailyCalorieGoal` is a number greater than 0.

2.  **Create Service Logic**
    -   Create a new file: `src/lib/services/UserGoalService.ts`.
    -   Implement a `UserGoalService` class that accepts a `SupabaseClient` in its constructor.
    -   Add an `async getUserGoal(userId: string)` method to fetch a user's goal from the `user_goals` table. It should return `UserGoalDto | null`.
    -   Add an `async upsertUserGoal(userId: string, dailyCalorieGoal: number)` method to perform an `upsert` operation on the `user_goals` table.

3.  **Create API Route**
    -   Create a new file: `src/pages/api/user-goals.ts`.
    -   Add `export const prerender = false;`
    -   Implement the `GET` request handler:
        -   Retrieve the user session from `context.locals`.
        -   Call `UserGoalService.getUserGoal()`.
        -   Return a `200 OK` response with the goal data or a `404 Not Found` if no goal exists.
    -   Implement the `PUT` request handler:
        -   Retrieve the user session.
        -   Validate the request body with the Zod schema.
        -   Call `UserGoalService.upsertUserGoal()`.
        -   Return a `200 OK` response on success.
    -   Include `try...catch` blocks in both handlers to catch any unexpected errors and return a `500 Internal Server Error` response.
