-- Row Level Security: owners can mutate their own data;
-- the public can read published portfolios and their images.

alter table users enable row level security;
alter table portfolios enable row level security;
alter table images enable row level security;

-- USERS
-- Anyone can read a user row by handle (needed to resolve /u/:handle).
create policy users_public_read on users
  for select using (true);

create policy users_self_update on users
  for update using (auth.uid() = id);

-- PORTFOLIOS
create policy portfolios_public_or_owner_read on portfolios
  for select using (published = true or auth.uid() = owner_id);

create policy portfolios_owner_insert on portfolios
  for insert with check (auth.uid() = owner_id);

create policy portfolios_owner_update on portfolios
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy portfolios_owner_delete on portfolios
  for delete using (auth.uid() = owner_id);

-- IMAGES
-- Public can read images of published portfolios.
create policy images_public_or_owner_read on images
  for select using (
    exists (
      select 1 from portfolios p
      where p.id = images.portfolio_id
        and (p.published = true or p.owner_id = auth.uid())
    )
  );

create policy images_owner_insert on images
  for insert with check (
    exists (select 1 from portfolios p where p.id = portfolio_id and p.owner_id = auth.uid())
  );

create policy images_owner_update on images
  for update using (
    exists (select 1 from portfolios p where p.id = portfolio_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from portfolios p where p.id = portfolio_id and p.owner_id = auth.uid())
  );

create policy images_owner_delete on images
  for delete using (
    exists (select 1 from portfolios p where p.id = portfolio_id and p.owner_id = auth.uid())
  );
