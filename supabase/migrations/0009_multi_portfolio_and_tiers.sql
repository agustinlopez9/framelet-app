-- Multi-portfolio support and user tiers

begin;

-- 1.2 Rename users.handle → users.username
alter table users rename column handle to username;
drop index if exists users_handle_idx;
create index users_username_idx on users (username);

-- 1.3 Add users.storage_used_bytes
alter table users add column storage_used_bytes bigint not null default 0;

-- 1.4 Drop UNIQUE constraint on portfolios.owner_id
alter table portfolios drop constraint portfolios_owner_id_key;

-- 1.5 Add portfolios.portfolio_handle with per-user unique constraint
alter table portfolios add column portfolio_handle text not null default '';
alter table portfolios add constraint portfolios_owner_handle_key unique (owner_id, portfolio_handle);

-- 1.6 Add portfolios.is_default with partial unique index
alter table portfolios add column is_default boolean not null default false;
create unique index portfolios_one_default_per_user on portfolios (owner_id) where is_default = true;

-- 1.11 Add images.file_size_bytes
alter table images add column file_size_bytes bigint not null default 0;

-- 1.9 Create videos table
create table videos (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  storage_path text not null,
  title text not null default '' check (char_length(title) <= 80),
  description text not null default '',
  position integer not null default 0,
  duration_seconds float,
  thumbnail_path text,
  file_size_bytes bigint not null default 0,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger videos_set_updated_at
  before update on videos
  for each row execute function set_updated_at();

create index videos_portfolio_position_idx on videos (portfolio_id, position);

-- 1.7 Create subscriptions table
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade unique,
  plan text not null check (plan in ('premium')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table subscriptions enable row level security;
alter table videos enable row level security;

-- 1.8 RLS for subscriptions: owner SELECT only; no client writes (admin only)
create policy subscriptions_owner_select on subscriptions
  for select using (auth.uid() = user_id);

-- 1.10 RLS for videos
create policy videos_public_or_owner_read on videos
  for select using (
    exists (
      select 1 from portfolios p
      where p.id = videos.portfolio_id
        and (p.published = true or p.owner_id = auth.uid())
    )
  );

create policy videos_owner_insert on videos
  for insert with check (
    exists (select 1 from portfolios p where p.id = portfolio_id and p.owner_id = auth.uid())
  );

create policy videos_owner_update on videos
  for update using (
    exists (select 1 from portfolios p where p.id = portfolio_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from portfolios p where p.id = portfolio_id and p.owner_id = auth.uid())
  );

create policy videos_owner_delete on videos
  for delete using (
    exists (select 1 from portfolios p where p.id = portfolio_id and p.owner_id = auth.uid())
  );

-- 1.12 adjust_storage_quota helper function
create or replace function adjust_storage_quota(p_user_id uuid, p_delta bigint) returns void
language plpgsql security definer as $$
begin
  update users set storage_used_bytes = storage_used_bytes + p_delta where id = p_user_id;
end;
$$;

-- 1.13 Triggers on images for quota
create or replace function images_quota_trigger_fn() returns trigger
language plpgsql security definer as $$
declare
  v_owner_id uuid;
begin
  if tg_op = 'INSERT' then
    select owner_id into v_owner_id from portfolios where id = new.portfolio_id;
    perform adjust_storage_quota(v_owner_id, new.file_size_bytes);
  elsif tg_op = 'DELETE' then
    select owner_id into v_owner_id from portfolios where id = old.portfolio_id;
    perform adjust_storage_quota(v_owner_id, -old.file_size_bytes);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger images_after_insert_quota
  after insert on images
  for each row execute function images_quota_trigger_fn();

create trigger images_after_delete_quota
  after delete on images
  for each row execute function images_quota_trigger_fn();

-- 1.14 Triggers on videos for quota
create or replace function videos_quota_trigger_fn() returns trigger
language plpgsql security definer as $$
declare
  v_owner_id uuid;
begin
  if tg_op = 'INSERT' then
    select owner_id into v_owner_id from portfolios where id = new.portfolio_id;
    perform adjust_storage_quota(v_owner_id, new.file_size_bytes);
  elsif tg_op = 'DELETE' then
    select owner_id into v_owner_id from portfolios where id = old.portfolio_id;
    perform adjust_storage_quota(v_owner_id, -old.file_size_bytes);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger videos_after_insert_quota
  after insert on videos
  for each row execute function videos_quota_trigger_fn();

create trigger videos_after_delete_quota
  after delete on videos
  for each row execute function videos_quota_trigger_fn();

-- 1.15 Portfolio count limit function (SECURITY INVOKER — runs as the calling user so auth.uid() is set)
create or replace function check_portfolio_limit() returns trigger
language plpgsql security invoker as $$
declare
  v_count int;
  v_limit int;
begin
  select count(*) into v_count from portfolios where owner_id = new.owner_id;

  if exists (
    select 1 from subscriptions
    where user_id = new.owner_id
      and plan = 'premium'
      and (expires_at is null or expires_at > now())
  ) then
    v_limit := 5;
  else
    v_limit := 1;
  end if;

  if v_count >= v_limit then
    raise exception 'Portfolio limit reached. Upgrade to premium to create more portfolios.';
  end if;

  return new;
end;
$$;

-- 1.16 BEFORE INSERT trigger on portfolios
create trigger portfolios_check_limit
  before insert on portfolios
  for each row execute function check_portfolio_limit();

-- 1.17 Backfill portfolio_handle from existing title slugs
update portfolios
set portfolio_handle = trim(
  both '-' from
  regexp_replace(
    regexp_replace(lower(coalesce(nullif(trim(title), ''), 'portfolio')), '[^a-z0-9]+', '-', 'g'),
    '-+', '-', 'g'
  )
)
where portfolio_handle = '';

-- Ensure no empty slugs remain (edge case: title was all special chars)
update portfolios set portfolio_handle = 'portfolio' where portfolio_handle = '' or portfolio_handle = '-';

-- 1.18 Set is_default = true for all existing portfolios (each user previously had exactly one)
update portfolios set is_default = true;

-- 1.19 Atomic reorder function for mixed media
create or replace function reorder_media(
  image_ids uuid[],
  video_ids uuid[],
  image_positions int[],
  video_positions int[],
  portfolio_id_in uuid
) returns void
language plpgsql security invoker as $$
declare
  i int;
begin
  if image_ids is not null and array_length(image_ids, 1) is not null then
    for i in 1..array_length(image_ids, 1) loop
      update images
      set position = image_positions[i]
      where id = image_ids[i] and portfolio_id = portfolio_id_in;
    end loop;
  end if;
  if video_ids is not null and array_length(video_ids, 1) is not null then
    for i in 1..array_length(video_ids, 1) loop
      update videos
      set position = video_positions[i]
      where id = video_ids[i] and portfolio_id = portfolio_id_in;
    end loop;
  end if;
end;
$$;

-- Update handle_new_auth_user to use username; do NOT auto-create portfolio
-- (portfolio creation now happens in the onboarding wizard)
create or replace function handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_username  text;
  v_base      text;
  v_suffix    int := 0;
  v_candidate text;
begin
  v_username := lower(trim(coalesce(new.raw_user_meta_data->>'username', '')));

  if v_username = '' then
    -- OAuth signup: derive username from email local part
    v_base := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]+', '-', 'g'));
    v_base := trim(both '-' from v_base);
    if v_base = '' then v_base := 'user'; end if;
    v_base := left(v_base, 28);

    v_candidate := v_base;
    loop
      if not exists (select 1 from public.users where username = v_candidate) then
        v_username := v_candidate;
        exit;
      end if;
      v_suffix    := v_suffix + 1;
      v_candidate := left(v_base, 28 - length(v_suffix::text)) || v_suffix::text;
      if v_suffix > 999 then
        raise exception 'could not generate unique username from email';
      end if;
    end loop;
  end if;

  -- Ensure minimum length of 3
  if char_length(v_username) < 3 then
    v_username := rpad(v_username, 3, '0');
  end if;

  insert into public.users (id, email, username) values (new.id, new.email, v_username);
  return new;
end;
$$;

commit;
