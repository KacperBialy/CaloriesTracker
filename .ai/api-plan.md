# REST API Plan

## 1. Resources

- **users** (`auth.users`)
  - Managed by Supabase Auth
  - Fields: `id` (UUID), `email`, `encrypted_password`, `created_at`, `confirmed_at`
  - Used for authentication and authorization

- **products** (`products`)
  - Fields: `id` (UUID), `name` (text), `nutrition_basis` (enum), `calories` (numeric), `protein` (numeric), `fat` (numeric), `carbs` (numeric)
  - Indexed by `name` (unique)
  - Caching layer for LLM lookups

- **entries** (`entries`)
  - Fields: `id` (UUID), `user_id` (UUID), `product_id` (UUID), `quantity` (numeric), `consumed_at` (date)
  - Indexed on `user_id`, `product_id`
  - FK to `auth.users(id)` and `products(id)` with ON DELETE/UPDATE CASCADE

- **user_goals** (`user_goals`)
  - Fields: `id` (UUID), `user_id` (UUID, unique), `daily_calorie_goal` (integer)
  - FK to `auth.users(id)` with ON DELETE/UPDATE CASCADE

## 2. Endpoints

### 2.1 Authentication

- All endpoints require `Authorization: Bearer <JWT>` header
- JWTs issued by Supabase Auth
- Middleware validates token and extracts `user_id`

### 2.2 Command Processing

**POST** `/api/commands/process`

- Description: Parse a free-text meal query, extract products & quantities, fetch nutritional info (cache first, fallback to LLM), save entries
- Request Payload:
  ```json
  {
    "text": "string" // e.g., "chicken 200g and rice 100g"
  }
  ```
- Response Payload:
  ```json
  {
    "successes": [
      {
        "entryId": "uuid",
        "productId": "uuid",
        "name": "string",
        "quantity": number,
        "nutrition": { "calories": number, "protein": number, "fat": number, "carbs": number },
        "consumedAt": "YYYY-MM-DD"
      }
    ],
    "errors": [
      { "text": "string", "message": "string" }
    ]
  }
  ```
- Success Codes: `201 Created` (at least one success)
- Error Codes: `400 Bad Request` (invalid payload), `401 Unauthorized` (missing/invalid token)

### 2.3 Entries Management

**GET** `/api/entries`

- Description: Retrieve a paginated list of user entries
- Query Parameters:
  - `date` (optional, default = today, format `YYYY-MM-DD`)
  - `page` (optional, default = 1)
  - `size` (optional, default = 20)
  - `sort` (optional, e.g. `consumed_at:desc`)
- Response Payload:
  ```json
  {
    "data": [
      {
        "entryId": "uuid",
        "productId": "uuid",
        "name": "string",
        "quantity": number,
        "nutrition": { "calories": number, "protein": number, "fat": number, "carbs": number },
        "consumedAt": "YYYY-MM-DD"
      }
    ],
    "pagination": { "page": number, "size": number, "total": number }
  }
  ```
- Success Codes: `200 OK`
- Error Codes: `400`, `401`

**DELETE** `/api/entries/{entryId}`

- Description: Delete a single entry
- Path Parameters: `entryId` (UUID)
- Success Codes: `204 No Content`
- Error Codes: `401`, `404 Not Found`, `403 Forbidden` (entry belongs to another user)

### 2.4 Products

**GET** `/api/products`

- Description: Search or list products (for autocomplete and caching verification)
- Query Parameters: `name` (optional substring match)
- Response Payload:
  ```json
  [{ "productId": "uuid", "name": "string", "nutritionBasis": "100G|100ML|UNIT", "calories": number, "protein": number, "fat": number, "carbs": number }]
  ```
- Success Codes: `200 OK`

**GET** `/api/products/{productId}`

- Description: Retrieve a single product by ID
- Path Parameters: `productId` (UUID)
- Success Codes: `200 OK`, `404 Not Found`

### 2.5 User Goals

**GET** `/api/user-goals`

- Description: Retrieve current user's daily calorie goal
- Response Payload:
  ```json
  { "dailyCalorieGoal": number }
  ```
- Success Codes: `200 OK`, `404 Not Found` (no goal set)

**PUT** `/api/user-goals`

- Description: Create or update user's daily calorie goal
- Request Payload:
  ```json
  { "dailyCalorieGoal": integer }
  ```
- Success Codes: `200 OK`
- Error Codes: `400 Bad Request` (non-positive integer), `401 Unauthorized`

### 2.6 Daily Summary

**GET** `/api/summary`

- Description: Retrieve aggregated calories and macros for a given date
- Query Parameters: `date` (optional, default = today)
- Response Payload:
  ```json
  { "calories": number, "protein": number, "fat": number, "carbs": number, "goal": number (nullable) }
  ```
- Success Codes: `200 OK`
- Error Codes: `401`

## 3. Authentication and Authorization

- Mechanism: JWT tokens issued by Supabase Auth (Google OAuth2)
- Implementation:
  - Middleware enforces `Authorization` header
  - Token validated via Supabase Admin SDK
  - Extract `user_id` from token for all user-scoped queries
- Database RLS policies ensure users only access their own `entries` and `user_goals`

## 4. Validation and Business Logic

- **products**: `calories`, `protein`, `fat`, `carbs` &ge; 0
- **entries**: `quantity` &gt; 0; `consumed_at` defaults to current date
- **user_goals**: `daily_calorie_goal` &gt; 0

**Business Logic**:

- **Command Processing**:
  1. Parse free-text via LLM → list of `{ name, quantity }`
  2. For each item:
     - Lookup `products` table by normalized name
     - If not found: fetch from LLM-backed nutrition API, insert into `products`
  3. Insert each entry with `user_id`, `product_id`, `quantity`, `date`
  4. Collect successes and errors, return both lists

- **Daily Summary**:
  - Sum `calories`, `protein`, `fat`, `carbs` from `entries` per user per date
  - Retrieve `daily_calorie_goal` to compare progress

- **Error Handling**:
  - Early return on invalid payloads
  - Partial success supported in `/commands/process`

- **Pagination & Sorting**
  - Default `page=1`, `size=20`, sort by `consumed_at:desc`

- **Rate Limiting & Security**:
  - Input sanitization to prevent injection
