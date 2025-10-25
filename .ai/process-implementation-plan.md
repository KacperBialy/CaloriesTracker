# API Endpoint Implementation Plan: POST /api/commands/process

## 1. Endpoint Overview

Parse a free-text meal description, resolve product names to nutrition data, persist consumption entries, and return both successful entries and parsing/storage errors. Supports partial successes in one request.

## 2. Request Details

- HTTP Method: POST
- URL: `/api/commands/process`
- Headers:
  - `Authorization: Bearer <token>` (JWT via Supabase Auth)
- Request Body (JSON):
  ```json
  {
    "text": "string" // e.g., "chicken 200g and rice 100g"
  }
  ```
- Parameters:
  - Required:
    - `text` (string): non-empty free-text meal description
  - Optional: none

## 3. Used Types

- **ProcessMealCommand** (from `src/types.ts`)
- **ErrorDto**
- **NutritionDto**
- **EntryDto**
- **ProcessResponseDto**

## 4. Response Details

- **201 Created**: at least one successful entry created
- **400 Bad Request**: invalid payload (Zod validation failure)
- **401 Unauthorized**: missing or invalid auth token
- **500 Internal Server Error**: unrecoverable server or LLM/database error

Response Body (201):

```json
{
  "successes": [
    /* EntryDto[] */
  ],
  "errors": [
    /* ErrorDto[] */
  ]
}
```

## 5. Data Flow

1. **Authenticate** user in middleware (verify JWT, attach `userId` to request).
2. **Validate** request body with Zod schema:
   - `text`: non-empty string, max length guard
3. **Invoke** `ProcessMealService.process({ text, userId })`:
   a. Call LLM parsing API to extract array of `{ name, quantity }`
   b. For each item:
   1. **Normalize** name (trim, lowercase)
   2. **Lookup** `products` table by `name`
   3. If not found:
      - Fetch nutrition via fallback LLM nutrition API
      - Insert new product row
   4. **Insert** into `entries`:
      - `user_id`, `product_id`, `quantity`, `consumed_at` = today
   5. Append to `successes` or record any per-item `ErrorDto` on failure
4. **Aggregate** successes and errors
5. **Respond** with 201 if any successes, else 400 or 500 based on failure type

## 6. Security Considerations

- **Authentication & Authorization**: enforce Supabase JWT in middleware
- **Input Sanitization**: escape or validate `text` before LLM calls to avoid prompt injection

## 7. Error Handling

| Scenario                               | Status  | Notes                                      |
| -------------------------------------- | ------- | ------------------------------------------ |
| Malformed JSON or missing `text`       | 400     | Return Zod error details                   |
| Empty or invalid `text`                | 400     | Guard clause early return                  |
| Unauthorized (missing/invalid token)   | 401     | Middleware handles                         |
| LLM parsing failure                    | 500     | Log error, return generic error            |
| DB constraint violation (quantity ≤ 0) | 400     | Map to ErrorDto, continue others           |
| Network/timeout during external fetch  | partial | Record per-item error, continue processing |
| No successes, all failures             | 500     | Fail fast or return 400 with errors only   |

## 8. Performance Considerations

- **Batch Lookups**: query products by `IN` on normalized names first
- **Caching**: in-memory cache for recent product lookups and LLM fetch results
- **Connection Pooling**: reuse DB connections via the Supabase client

## 9. Implementation Steps

1. **Schema & Types**:
   - Define Zod schema for `ProcessMealCommand`
   - Ensure all DTOs imported from `src/types.ts`
2. **Service Layer**:
   - Implement `parseText`, `fetchOrCreateProduct`, and `insertEntries`
3. **LLM Integration**:
   - Abstract LLM calls behind `LLMClient` in `src/lib/utils.ts`
   - Handle rate limits and retries
4. **API Route Handler**:
   - Create `src/pages/api/commands/process.ts`
   - Wire authentication, validation, service invocation, and response
5. **Middleware**:
   - Add rate limiting and auth middleware in `src/middleware/index.ts`
6. **Logging & Monitoring**:
   - Integrate server-side logging for errors and performance metrics
7. **Testing**:
   - Unit tests for service logic (mock DB and LLM)
   - Integration tests for full endpoint behavior
8. **Documentation & Deployment**:
   - Document endpoint in `README.md`
   - Verify environment variables (`SUPABASE_URL`, `SUPABASE_KEY`, `LLM_API_KEY`)
