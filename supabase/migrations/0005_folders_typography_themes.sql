-- portfolio-and-auth-improvements
--
-- 1. Adds image folders (portfolio-scoped, ordered, hideable).
-- 2. Adds folder_id (nullable) to images.
-- 3. Adds folder_display_mode and font_id to portfolios.
-- 4. Logs and migrates portfolios on retired gallery themes to the default.
--
-- Down-migration lives at 0005_folders_typography_themes_down.sql.

set search_path = public;

-- 1. Folders
create table image_folders (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  position integer not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index image_folders_portfolio_position_idx
  on image_folders (portfolio_id, position);

-- 2. Images get a folder pointer; deleting a folder leaves images Unfiled.
alter table images
  add column folder_id uuid references image_folders(id) on delete set null;

create index images_folder_idx on images (folder_id);

-- 3. Portfolio-level display mode and font.
alter table portfolios
  add column folder_display_mode text not null default 'flat'
    check (folder_display_mode in ('tabs', 'flat')),
  add column font_id text not null default 'default';

-- 4. Theme migration log + backfill.
create table theme_migration_log (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  previous_theme_id text not null,
  migrated_to text not null default 'ocean-depths',
  migrated_at timestamptz not null default now()
);

with retired as (
  select id, gallery_theme_id
  from portfolios
  where gallery_theme_id in (
    'botanical-garden',
    'golden-hour',
    'forest-canopy',
    'sunset-boulevard'
  )
)
insert into theme_migration_log (portfolio_id, previous_theme_id)
select id, gallery_theme_id from retired;

update portfolios
   set gallery_theme_id = 'ocean-depths'
 where gallery_theme_id in (
   'botanical-garden',
   'golden-hour',
   'forest-canopy',
   'sunset-boulevard'
 );
