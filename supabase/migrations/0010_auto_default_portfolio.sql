-- Automatically set is_default = true when a user creates their first portfolio.
-- This allows the client to INSERT without sending is_default in the payload,
-- working around PostgREST schema-cache staleness after migrations.

create or replace function portfolios_auto_set_default() returns trigger
language plpgsql security definer as $$
begin
  if not exists (select 1 from portfolios where owner_id = new.owner_id) then
    new.is_default := true;
  end if;
  return new;
end;
$$;

create trigger portfolios_auto_default
  before insert on portfolios
  for each row execute function portfolios_auto_set_default();
