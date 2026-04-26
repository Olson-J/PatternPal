-- Milestone 3 mock-target schema for future Supabase integration.
-- This file defines the intended relational structure while current runtime
-- persistence uses fixture-backed in-memory storage.

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text not null,
  mode text not null check (mode in ('casual', 'professional')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists instructions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  garment text not null,
  materials jsonb not null,
  assembly jsonb not null,
  finishing jsonb not null,
  notes text,
  generated_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_instructions_project_id on instructions(project_id);

-- Enable row level security for all app tables.
alter table users enable row level security;
alter table projects enable row level security;
alter table instructions enable row level security;

-- Recreate policies so the script can be re-run safely.
drop policy if exists users_select_own on users;
drop policy if exists users_insert_own on users;
drop policy if exists users_update_own on users;

drop policy if exists projects_select_own on projects;
drop policy if exists projects_insert_own on projects;
drop policy if exists projects_update_own on projects;
drop policy if exists projects_delete_own on projects;

drop policy if exists instructions_select_own on instructions;
drop policy if exists instructions_insert_own on instructions;
drop policy if exists instructions_update_own on instructions;
drop policy if exists instructions_delete_own on instructions;

-- Users can only read/write their own profile row.
create policy users_select_own
  on users
  for select
  to authenticated
  using (id = auth.uid());

create policy users_insert_own
  on users
  for insert
  to authenticated
  with check (id = auth.uid());

create policy users_update_own
  on users
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Users can only access their own projects.
create policy projects_select_own
  on projects
  for select
  to authenticated
  using (user_id = auth.uid());

create policy projects_insert_own
  on projects
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy projects_update_own
  on projects
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy projects_delete_own
  on projects
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Users can only access instructions tied to projects they own.
create policy instructions_select_own
  on instructions
  for select
  to authenticated
  using (
    exists (
      select 1
      from projects
      where projects.id = instructions.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy instructions_insert_own
  on instructions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from projects
      where projects.id = instructions.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy instructions_update_own
  on instructions
  for update
  to authenticated
  using (
    exists (
      select 1
      from projects
      where projects.id = instructions.project_id
        and projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from projects
      where projects.id = instructions.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy instructions_delete_own
  on instructions
  for delete
  to authenticated
  using (
    exists (
      select 1
      from projects
      where projects.id = instructions.project_id
        and projects.user_id = auth.uid()
    )
  );
