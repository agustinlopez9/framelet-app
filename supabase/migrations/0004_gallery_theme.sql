-- Per-portfolio gallery theme. Defaults to 'ocean-depths' so existing rows
-- pick up the column non-disruptively. The catalog of valid ids is enforced
-- in code (see src/themes/catalog.ts); unknown values fall back at render.

alter table portfolios
  add column gallery_theme_id text not null default 'ocean-depths';
