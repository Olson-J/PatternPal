-- Milestone 3 mock-target schema for future Supabase integration.
-- This file defines the intended relational structure while current runtime
-- persistence uses fixture-backed in-memory storage.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
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
