import { supabase } from '@/lib/supabase';
import type { Portfolio, PortfolioImage, TemplateConfig } from '@/types';

interface PortfolioRow {
  id: string;
  owner_id: string;
  title: string;
  bio: string;
  template_id: string;
  template_config: TemplateConfig;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface UserRow {
  id: string;
  email: string;
  handle: string;
  created_at: string;
}

interface ImageRow {
  id: string;
  portfolio_id: string;
  storage_path: string;
  title: string;
  description: string;
  alt_text: string;
  position: number;
  width: number | null;
  height: number | null;
  created_at: string;
}

const PUBLIC_BUCKET = 'portfolio-images';

function publicUrlFor(path: string): string {
  const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function rowToPortfolio(row: PortfolioRow, handle: string): Portfolio {
  return {
    id: row.id,
    ownerId: row.owner_id,
    handle,
    title: row.title,
    bio: row.bio,
    templateId: row.template_id,
    templateConfig: row.template_config,
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToImage(row: ImageRow): PortfolioImage {
  return {
    id: row.id,
    portfolioId: row.portfolio_id,
    storagePath: row.storage_path,
    url: publicUrlFor(row.storage_path),
    title: row.title,
    description: row.description,
    altText: row.alt_text,
    position: row.position,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
  };
}

export async function getMyPortfolio(): Promise<Portfolio | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', auth.user.id)
    .single<UserRow>();
  if (userErr || !user) return null;

  const { data: portfolio, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('owner_id', user.id)
    .single<PortfolioRow>();
  if (error || !portfolio) return null;

  return rowToPortfolio(portfolio, user.handle);
}

export interface PublicPortfolioResult {
  portfolio: Portfolio;
  images: PortfolioImage[];
}

export async function getPortfolioByHandle(handle: string): Promise<PublicPortfolioResult | null> {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('handle', handle.toLowerCase())
    .maybeSingle<UserRow>();
  if (!user) return null;

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle<PortfolioRow>();
  if (!portfolio) return null;

  const { data: images } = await supabase
    .from('images')
    .select('*')
    .eq('portfolio_id', portfolio.id)
    .order('position', { ascending: true });

  return {
    portfolio: rowToPortfolio(portfolio, user.handle),
    images: (images ?? []).map(rowToImage),
  };
}

export interface UpdatePortfolioInput {
  title?: string;
  bio?: string;
  templateId?: string;
  templateConfig?: TemplateConfig;
  published?: boolean;
}

export async function updatePortfolio(id: string, patch: UpdatePortfolioInput): Promise<Portfolio> {
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.bio !== undefined) update.bio = patch.bio;
  if (patch.templateId !== undefined) update.template_id = patch.templateId;
  if (patch.templateConfig !== undefined) update.template_config = patch.templateConfig;
  if (patch.published !== undefined) update.published = patch.published;

  const { data, error } = await supabase
    .from('portfolios')
    .update(update)
    .eq('id', id)
    .select('*, users:owner_id(handle)')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to update portfolio');

  const row = data as PortfolioRow & { users: { handle: string } };
  return rowToPortfolio(row, row.users.handle);
}
