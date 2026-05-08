-- 1. Fix image_folders RLS: public visitors can read folders of published portfolios
drop policy folders_owner_select on image_folders;

create policy folders_public_or_owner_select on image_folders for select
  using (
    exists (
      select 1 from portfolios
      where id = portfolio_id
        and (published = true or owner_id = auth.uid())
    )
  );

-- 2. Atomic reorder function for images
create or replace function reorder_images(ids uuid[], portfolio_id_in uuid)
returns void
language plpgsql
security invoker
as $$
declare
  i int;
begin
  for i in 1..array_length(ids, 1) loop
    update images
    set position = i - 1
    where id = ids[i] and portfolio_id = portfolio_id_in;
  end loop;
end;
$$;

-- 3. Atomic reorder function for folders
create or replace function reorder_folders(ids uuid[], portfolio_id_in uuid)
returns void
language plpgsql
security invoker
as $$
declare
  i int;
begin
  for i in 1..array_length(ids, 1) loop
    update image_folders
    set position = i - 1
    where id = ids[i] and portfolio_id = portfolio_id_in;
  end loop;
end;
$$;

-- 4. Add updated_at to images
alter table images add column updated_at timestamptz;

create trigger images_set_updated_at
  before update on images
  for each row execute function set_updated_at();

-- 5. Add updated_at to image_folders
alter table image_folders add column updated_at timestamptz;

create trigger image_folders_set_updated_at
  before update on image_folders
  for each row execute function set_updated_at();
