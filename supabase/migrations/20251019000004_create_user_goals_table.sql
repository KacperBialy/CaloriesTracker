-- migration: create user_goals table
-- stores daily calorie goals per user with referential integrity and RLS

-- create user_goals table
create table if not exists user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  daily_calorie_goal integer not null check (daily_calorie_goal > 0)
);

-- foreign key constraint linking to auth.users
alter table user_goals
  add constraint fk_user_goals_user_id foreign key (user_id)
    references auth.users(id) on delete cascade on update cascade;

-- enable row level security on user_goals
alter table user_goals enable row level security;

-- RLS policies for user_goals

-- allow select for authenticated users on own goal
create policy "select_goals_authenticated" on user_goals
  for select to authenticated
  using (user_id = auth.uid());

-- allow insert for authenticated users when user_id matches
create policy "insert_goals_authenticated" on user_goals
  for insert to authenticated
  with check (user_id = auth.uid());

-- allow update for authenticated users on own goal
create policy "update_goals_authenticated" on user_goals
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- allow delete for authenticated users on own goal
create policy "delete_goals_authenticated" on user_goals
  for delete to authenticated
  using (user_id = auth.uid());
