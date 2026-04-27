-- Framelet initial schema
-- Run in order against a fresh Supabase project.

set search_path = public;

-- Users (mirrors auth.users with profile info)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  handle text not null unique
    check (handle ~ '^[a-z0-9][a-z0-9-]{2,29}$'),
  created_at timestamptz not null default now()
);

create index users_handle_idx on users (handle);

-- Portfolios (one per user for the MVP)
create table portfolios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references users(id) on delete cascade,
  title text not null default '' check (char_length(title) <= 80),
  bio text not null default '' check (char_length(bio) <= 500),
  template_id text not null default 'simple-grid',
  template_config jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger portfolios_set_updated_at
  before update on portfolios
  for each row execute function set_updated_at();

-- Images
create table images (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  storage_path text not null,
  title text not null default '' check (char_length(title) <= 80),
  description text not null default '',
  alt_text text not null default '' check (char_length(alt_text) <= 200),
  position integer not null default 0,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create index images_portfolio_position_idx on images (portfolio_id, position);

-- Auto-create a row in public.users + a default portfolio when a user signs up.
-- The handle must be supplied via auth metadata at signup time.
create or replace function handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_handle text := lower(coalesce(new.raw_user_meta_data->>'handle', ''));
begin
  if v_handle = '' then
    raise exception 'handle is required in user_metadata at signup';
  end if;
  insert into public.users (id, email, handle) values (new.id, new.email, v_handle);
  insert into public.portfolios (owner_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
