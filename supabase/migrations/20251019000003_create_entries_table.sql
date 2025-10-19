-- migration: create entries table
-- tracks user consumption entries with referential integrity and RLS

-- create entries table
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid not null,
  quantity numeric(10,2) not null check (quantity > 0),
  consumed_at date not null default current_date
);

-- indexes for efficient lookups
create index if not exists idx_entries_user_id on entries(user_id);
create index if not exists idx_entries_product_id on entries(product_id);

-- foreign key constraints
alter table entries
  add constraint fk_entries_user_id foreign key (user_id)
    references auth.users(id) on delete cascade on update cascade;

alter table entries
  add constraint fk_entries_product_id foreign key (product_id)
    references products(id) on delete cascade on update cascade;

-- enable row level security on entries
alter table entries enable row level security;

-- RLS policies for entries

-- deny select for anon role
create policy "select_entries_anon" on entries
  for select to anon
  using (false);

-- allow select for authenticated users on own records
create policy "select_entries_authenticated" on entries
  for select to authenticated
  using (user_id = auth.uid());

-- deny insert for anon role
create policy "insert_entries_anon" on entries
  for insert to anon
  with check (false);

-- allow insert for authenticated users when user_id matches
create policy "insert_entries_authenticated" on entries
  for insert to authenticated
  with check (user_id = auth.uid());

-- deny update for anon role
create policy "update_entries_anon" on entries
  for update to anon
  using (false);

-- allow update for authenticated users on own records
create policy "update_entries_authenticated" on entries
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- deny delete for anon role
create policy "delete_entries_anon" on entries
  for delete to anon
  using (false);

-- allow delete for authenticated users on own records
create policy "delete_entries_authenticated" on entries
  for delete to authenticated
  using (user_id = auth.uid());
