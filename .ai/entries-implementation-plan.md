# API Endpoint Implementation Plan: Entry Management

## 1. Endpoint Overview
This document outlines the implementation plan for the `GET /api/entries` and `DELETE /api/entries/{entryId}` endpoints. These endpoints provide the core functionality for users to view and manage their daily food consumption entries.

## 2. Request Details

### GET `/api/entries`
- **HTTP Method**: `GET`
- **URL Structure**: `/api/entries`
- **Description**: Retrieves a list of entries for the authenticated user.
- **Parameters**:
  - **Query Parameters (Optional)**:
    - `date` (string): Filters entries for a specific date in `YYYY-MM-DD` format.

### DELETE `/api/entries/{entryId}`
- **HTTP Method**: `DELETE`
- **URL Structure**: `/api/entries/{entryId}`
- **Description**: Deletes a specific entry for the authenticated user.
- **Parameters**:
  - **Path Parameters (Required)**:
    - `entryId` (UUID): The unique identifier for the entry to be deleted.

## 3. Used Types
The following types and validation schemas from `src/types.ts` will be used or created.

### Existing Types
- `EntryDto`: Represents a single entry in API responses.
- `EntriesResponseDto`: The shape of the response for `GET /api/entries`.
- `PaginationDto`: Contains pagination metadata.
- `GetEntriesQuery`: Defines the type for query parameters.

### New Zod Schemas
The following Zod schemas should be added to `src/types.ts` for robust input validation.

```typescript
// src/types.ts

// ... existing code ...

/**
 * Validates GetEntriesQuery input
 * - date: optional, 'YYYY-MM-DD' format
 */
export const GetEntriesQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
});

export type GetEntriesQueryType = z.infer<typeof GetEntriesQuerySchema>;

/**
 * Validates entryId path parameter
 * - entryId: UUID string
 */
export const EntryIdParamSchema = z.object({
  entryId: z.string().uuid("Invalid entry ID format"),
});

// ... existing code ...
```

## 4. Response Details

### GET `/api/entries`
- **Success (200 OK)**:
  ```json
  {
    "data": [
      {
        "entryId": "uuid",
        "productId": "uuid",
        "name": "Chicken Breast",
        "quantity": 200,
        "nutrition": { "calories": 330, "protein": 62, "fat": 6, "carbs": 0 },
        "consumedAt": "2025-10-26"
      }
    ]
  }
  ```
- **Error**: `400 Bad Request`, `401 Unauthorized`.

### DELETE `/api/entries/{entryId}`
- **Success (204 No Content)**: Empty response body.
- **Error**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

## 5. Data Flow
1.  **Request**: An incoming request hits the Astro API route (`/api/entries/index.ts` or `/api/entries/[entryId].ts`).
2.  **Middleware**: The Astro middleware (`src/middleware/index.ts`) intercepts the request to verify the user's session. If the user is unauthenticated, it returns a `401 Unauthorized` error. Otherwise, it attaches the user session and Supabase client to `context.locals`.
3.  **Controller (Astro API Route)**:
    - The route handler extracts parameters from the request (query for GET, path for DELETE).
    - It uses the appropriate Zod schema (`GetEntriesQuerySchema` or `EntryIdParamSchema`) to validate the input. If validation fails, it returns a `400 Bad Request` error.
    - It calls the corresponding method in the `EntryService`, passing the validated parameters and the user's ID.
4.  **Service (`EntryService.ts`)**:
    - **`getEntries`**: Constructs and executes a Supabase query to fetch entries. It joins with the `products` table to get product names and applies `WHERE` clauses for `user_id` and `date`. Finally, it maps the database results to the `EntryDto` format.
    - **`deleteEntry`**: Executes a Supabase query to delete an entry, ensuring the `DELETE` statement includes `WHERE id = :entryId AND user_id = :userId`. It checks the result to determine if the deletion was successful, if the entry was not found, or if it belonged to another user, returning the appropriate outcome.
5.  **Response**: The controller receives the data or error from the service and formats the final HTTP response with the correct status code and body.

## 6. Security Considerations
- **Authentication**: All endpoints will be protected by the existing session-based authentication middleware. No unauthenticated access is permitted.
- **Authorization**: The `EntryService` is responsible for enforcing data ownership. Every database query (SELECT, DELETE) must be scoped to the authenticated `user_id` to prevent Insecure Direct Object Reference (IDOR) vulnerabilities.
- **Input Validation**: All client-provided input (query and path parameters) will be strictly validated using Zod schemas to prevent injection attacks and ensure data integrity.

## 7. Error Handling
| Scenario                                        | HTTP Status Code | Endpoint(s)      | Reason                                                                    |
| ----------------------------------------------- | ---------------- | ---------------- | ------------------------------------------------------------------------- |
| Request without a valid session                 | `401 Unauthorized` | Both             | User is not logged in. Handled by middleware.                             |
| Invalid query params (e.g., bad date format)      | `400 Bad Request`  | `GET /entries`   | Client-side validation error.                                             |
| Invalid `entryId` format (not a UUID)           | `400 Bad Request`  | `DELETE /entryId`| The provided ID is malformed.                                             |
| `entryId` does not exist                        | `404 Not Found`    | `DELETE /entryId`| The resource to be deleted cannot be found.                               |
| User attempts to delete another user's entry    | `403 Forbidden`    | `DELETE /entryId`| Authorization failure; prevents leaking information about resource existence.|
| Unexpected server-side issue (e.g., DB error) | `500 Internal Server Error` | Both             | A generic error for unforeseen issues, which will be logged.            |


## 8. Implementation Steps
1.  **Update Types**: Add the `GetEntriesQuerySchema` and `EntryIdParamSchema` Zod schemas to `src/types.ts` as detailed in Section 3.
2.  **Create Service File**: Create a new file at `src/lib/services/EntryService.ts`.
3.  **Implement `EntryService`**:
    - Add a `getEntries` method that accepts `userId` and `GetEntriesQueryType`. This method will query the database,  and return data in the `EntriesResponseDto` format.
    - Add a `deleteEntry` method that accepts `userId` and `entryId`. This method will perform an ownership-aware deletion and handle `Not Found` and `Forbidden` cases.
4.  **Create GET Endpoint**: Create the file `src/pages/api/entries/index.ts`. Implement the `GET` handler which validates query parameters using `GetEntriesQuerySchema` and calls `EntryService.getEntries`.
5.  **Create DELETE Endpoint**: Create the file `src/pages/api/entries/[entryId].ts`. Implement the `DELETE` handler which validates the `entryId` path parameter using `EntryIdParamSchema` and calls `EntryService.deleteEntry`.
6.  **Database Indexing**: Add a migration to ensure an index exists on `(user_id, consumed_at)` in the `entries` table for efficient lookups.
