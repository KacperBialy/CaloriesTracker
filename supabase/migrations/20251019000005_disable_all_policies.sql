-- migration: disable all policies
-- disables row level security on products, entries, and user_goals tables

-- disable row level security on products table
alter table products disable row level security;

-- disable row level security on entries table
alter table entries disable row level security;

-- disable row level security on user_goals table
alter table user_goals disable row level security;
