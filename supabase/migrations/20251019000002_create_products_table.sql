-- migration: create products table
-- creates products with nutritional information and row-level security policies

-- create products table
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  nutrition_basis nutrition_basis_enum not null,
  calories numeric(10,2) not null check (calories >= 0),
  protein numeric(10,2) not null check (protein >= 0),
  fat numeric(10,2) not null check (fat >= 0),
  carbs numeric(10,2) not null check (carbs >= 0)
);

-- enable row level security on products
alter table products enable row level security;

-- policies for products: only authenticated users granted access

-- select policy for authenticated users
create policy "select_products_authenticated" on products
  for select to authenticated
  using (true);

-- insert policy for authenticated users
create policy "insert_products_authenticated" on products
  for insert to authenticated
  with check (true);

-- update policy for authenticated users
create policy "update_products_authenticated" on products
  for update to authenticated
  using (true)
  with check (true);

-- delete policy for authenticated users
create policy "delete_products_authenticated" on products
  for delete to authenticated
  using (true);
