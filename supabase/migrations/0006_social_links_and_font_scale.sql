-- polish-pass-three
--
-- Adds two columns to portfolios:
-- 1. social_links: JSON array of { platform, url, label? } entries shown in
--    the public portfolio footer. Defaults to []; existing rows backfill.
-- 2. font_scale: type-scale picker ('small' | 'regular' | 'large') feeding
--    the new --portfolio-font-scale CSS variable in ThemeScope. Defaults to
--    'regular'; existing rows backfill.

set search_path = public;

alter table portfolios
  add column social_links jsonb not null default '[]'::jsonb,
  add column font_scale text not null default 'regular'
    check (font_scale in ('small', 'regular', 'large'));
