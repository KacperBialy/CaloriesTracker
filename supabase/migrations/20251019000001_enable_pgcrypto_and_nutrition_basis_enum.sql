-- migration: enable pgcrypto extension and define nutrition_basis_enum type
-- sets up server-side uuid generation and nutrition basis enumeration

-- enable pgcrypto extension for server-side uuid generation
create extension if not exists "pgcrypto";

-- create enum for nutrition basis
create type nutrition_basis_enum as enum ('100g', '100ml', 'unit');
