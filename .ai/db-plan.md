# CaloriesTracker – PostgreSQL Schema (MVP)

## 1. Tables

### 1.1 enums

```sql
-- Enables server-side UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE nutrition_basis_enum AS ENUM ('100G', '100ML', 'UNIT');
```

### 1.2. users

This table is managed by Supabase Auth.

- id: UUID PRIMARY KEY
- email: VARCHAR(255) NOT NULL UNIQUE
- encrypted_password: VARCHAR NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- confirmed_at: TIMESTAMPTZ

### 1.3 products

| column          | type                 | constraints                            |
| --------------- | -------------------- | -------------------------------------- |
| id              | uuid                 | PRIMARY KEY, default gen_random_uuid() |
| name            | text                 | NOT NULL, UNIQUE                       |
| nutrition_basis | nutrition_basis_enum | NOT NULL                               |
| calories        | numeric(10,2)        | NOT NULL, CHECK (calories >= 0)        |
| protein         | numeric(10,2)        | NOT NULL, CHECK (protein >= 0)         |
| fat             | numeric(10,2)        | NOT NULL, CHECK (fat >= 0)             |
| carbs           | numeric(10,2)        | NOT NULL, CHECK (carbs >= 0)           |

### 1.4 entries

| column      | type          | constraints                            |
| ----------- | ------------- | -------------------------------------- |
| id          | uuid          | PRIMARY KEY, default gen_random_uuid() |
| user_id     | uuid          | NOT NULL                               |
| product_id  | uuid          | NOT NULL                               |
| quantity    | numeric(10,2) | NOT NULL, CHECK (quantity > 0)         |
| consumed_at | date          | NOT NULL, default CURRENT_DATE         |

### 1.4 user_goals

| column             | type    | constraints                              |
| ------------------ | ------- | ---------------------------------------- |
| id                 | uuid    | PRIMARY KEY, default gen_random_uuid()   |
| user_id            | uuid    | NOT NULL, UNIQUE                         |
| daily_calorie_goal | integer | NOT NULL, CHECK (daily_calorie_goal > 0) |

---

## 2. Foreign Key Constraints

```sql
-- entries → users (auth.users via Supabase Auth)
ALTER TABLE entries
ADD CONSTRAINT fk_entries_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- entries → products
ALTER TABLE entries
ADD CONSTRAINT fk_entries_product_id
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- user_goals → users (auth.users via Supabase Auth)
ALTER TABLE user_goals
ADD CONSTRAINT fk_user_goals_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## 3. Relationships (logical)

- products (1) ↔ (∞) entries via `product_id`
- users (1) ↔ (∞) entries via `user_id`
- users (1) ↔ (1) user_goals via `user_id`

_Note: Foreign-key constraints are now included in the schema and enforce referential integrity._

---

## 4. Indexes

```sql
-- Already created implicitly by PRIMARY KEY / UNIQUE constraints:
--   products_pkey                on products(id)
--   products_name_key            on products(name)
--   entries_pkey                 on entries(id)
--   user_goals_pkey              on user_goals(id)
--   user_goals_user_id_key       on user_goals(user_id)

-- Helpful non-unique indexes for read patterns (added explicitly):
CREATE INDEX IF NOT EXISTS idx_entries_user_id    ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_product_id ON entries(product_id);
```

---

## 5. PostgreSQL Row-Level Security

In the tables entries, user_goals, implement RLS policies that allow a user to access only the records where user_id matches the user's identifier from Supabase Auth (e.g., auth.uid() = user_id). For products check only if user is authenticated.

---

## 6. Additional Notes

1. `pgcrypto` provides `gen_random_uuid()` for server-side UUID generation, ensuring global uniqueness and avoiding client-side coupling.
2. Check constraints enforce data integrity for macronutrient values and user-provided quantities/goals.
3. Only one explicit UNIQUE constraint (`products.name`) is included to allow fast product-name look-ups while preserving case sensitivity.
4. Foreign-key constraints use `ON DELETE CASCADE` to automatically clean up child records when parents are deleted, maintaining referential integrity while simplifying data management.
5. Composite indexes, timestamp/audit columns, and duplicate-entry prevention will be revisited after real-world usage patterns emerge.
6. All tables are in 3NF and ready for migration tooling (e.g., Supabase migrations or Prisma).

```

```
