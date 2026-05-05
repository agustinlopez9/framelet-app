-- image_folders
ALTER TABLE image_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY folders_owner_select ON image_folders FOR SELECT
  USING (EXISTS (SELECT 1 FROM portfolios WHERE id = portfolio_id AND owner_id = auth.uid()));

CREATE POLICY folders_owner_insert ON image_folders FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM portfolios WHERE id = portfolio_id AND owner_id = auth.uid()));

CREATE POLICY folders_owner_update ON image_folders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM portfolios WHERE id = portfolio_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM portfolios WHERE id = portfolio_id AND owner_id = auth.uid()));

CREATE POLICY folders_owner_delete ON image_folders FOR DELETE
  USING (EXISTS (SELECT 1 FROM portfolios WHERE id = portfolio_id AND owner_id = auth.uid()));

-- theme_migration_log
ALTER TABLE theme_migration_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY theme_log_owner_select ON theme_migration_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM portfolios WHERE id = portfolio_id AND owner_id = auth.uid()));

CREATE POLICY theme_log_owner_insert ON theme_migration_log FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM portfolios WHERE id = portfolio_id AND owner_id = auth.uid()));

CREATE POLICY theme_log_owner_update ON theme_migration_log FOR UPDATE
  USING (EXISTS (SELECT 1 FROM portfolios WHERE id = portfolio_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM portfolios WHERE id = portfolio_id AND owner_id = auth.uid()));

CREATE POLICY theme_log_owner_delete ON theme_migration_log FOR DELETE
  USING (EXISTS (SELECT 1 FROM portfolios WHERE id = portfolio_id AND owner_id = auth.uid()));
