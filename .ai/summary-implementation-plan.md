# API Endpoint Implementation Plan: GET /api/summary

## 1. Endpoint Overview
Retrieve the user’s aggregated daily nutrition summary, including total calories, protein, fat, carbs, and the user’s daily calorie goal for a specific date (defaults to today). The endpoint enforces authentication and leverages Supabase RLS policies.

## 2. Request Details
- HTTP Method: GET
- URL: `/api/summary`
- Query Parameters:
  - Optional:
    - `date` (string, ISO `YYYY-MM-DD`): Target date for aggregation. Defaults to server’s current date if omitted.
- Request Body: None

## 3. Used Types
- **GetSummaryQuery** (new): Zod schema for query validation.
- **DailySummaryDto** (from `src/types.ts`):
  ```ts
  export type DailySummaryDto = {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    goal: number | null;
  };
  ```

## 4. Response Details
- **200 OK**: Returns JSON conforming to `DailySummaryDto`.
- **400 Bad Request**: Invalid `date` format.
- **401 Unauthorized**: Missing or invalid authentication.
- **500 Internal Server Error**: Unexpected failures.

## 5. Data Flow
1. **Authentication**: Use DEFAULT_USER_ID from supabase.client.ts at the moment.
2. **Validate Input**: Use Zod to parse and validate `date`.
3. **Service Call**: Invoke `SummaryService.getDailySummary(userId, date)`:
   - Query `entries` where `user_id` = current user and `consumed_at` = date.
   - Join `products` table to compute per-entry nutrition:
     ```sql
     SELECT
       SUM(
         CASE
           WHEN nutrition_basis IN ('100G','100ML') THEN p.calories * e.quantity / 100
           ELSE p.calories * e.quantity
         END
       ) AS calories,
       ...
     FROM entries e
     JOIN products p ON p.id = e.product_id
     WHERE e.user_id = :userId AND e.consumed_at = :date;
     ```
   - Fetch `daily_calorie_goal` from `user_goals` for user (nullable).
   - Return aggregated totals and goal.
4. **Return Response**: Serialize service result to JSON.

## 6. Error Handling
| Scenario                   | Response Code | Handling                                         |
|----------------------------|---------------|--------------------------------------------------|
| Invalid `date` format      | 400           | Return 400, validation error details             |
| No entries found           | 200           | Return zeros for macros and `goal` as null if unset |
| DB query failure           | 500           | Log error, return 500 with generic message       |

## 8. Performance Considerations
- Single aggregated SQL query reduces round trips.

## 9. Implementation Steps
1. **Define Zod Schema**: In the API route, create `GetSummaryQuerySchema`:
   ```ts
   const GetSummaryQuerySchema = z.object({
     date: z.string().optional().refine(isValidIsoDate, {
       message: 'Invalid date format',
     }),
   });
   ```
2. **Create Service**: Add `src/lib/services/SummaryService.ts`:
   - Implement `getDailySummary(userId: string, date?: string)`.
   - Write aggregated SQL via Supabase client.
3. **Implement API Route**: Create `src/pages/api/summary.ts`:
   - Set `export const prerender = false`.
   - Import and validate query using Zod.
   - Retrieve user from supabase.client.ts.
   - Call `SummaryService` and handle success/errors.
4. **Configure Middleware**: Ensure `src/middleware/index.ts` applies supabase client.
5. **Add Utility**: Implement `isValidIsoDate` helper in `src/lib/utils.ts`.
6. **Documentation**: Update `README.md` with endpoint details and example responses.
7. **Lint & Format**: Run project linter and ensure no errors.
