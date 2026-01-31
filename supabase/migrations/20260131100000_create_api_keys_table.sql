-- migration: create api_keys table
-- stores api keys per user with referential integrity and rls

-- create api_keys table
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  key text not null unique,
  created_at timestamp with time zone default now()
);

-- foreign key constraint linking to auth.users
alter table api_keys
  add constraint fk_api_keys_user_id foreign key (user_id)
    references auth.users(id) on delete cascade on update cascade;

-- enable row level security on api_keys
alter table api_keys enable row level security;

-- RLS policies for api_keys

-- allow select for authenticated users on own api keys
create policy "select_api_keys_authenticated" on api_keys
  for select to authenticated
  using (user_id = auth.uid());

-- allow insert for authenticated users when user_id matches
create policy "insert_api_keys_authenticated" on api_keys
  for insert to authenticated
  with check (user_id = auth.uid());

-- allow delete for authenticated users on own api keys
create policy "delete_api_keys_authenticated" on api_keys
  for delete to authenticated
  using (user_id = auth.uid());
