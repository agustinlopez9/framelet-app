import { supabase } from '@/lib/supabase';
import type {
  FolderDisplayMode,
  FontScale,
  ImageFolder,
  Portfolio,
  PortfolioImage,
  SocialLink,
  TemplateConfig,
} from '@/features/portfolio/types';
import { listFolders } from './folders';

interface PortfolioRow {
  id: string;
  owner_id: string;
  portfolio_handle: string;
  is_default: boolean;
  title: string;
  bio: string;
  template_id: string;
  template_config: TemplateConfig;
  gallery_theme_id: string;
  folder_display_mode: FolderDisplayMode | null;
  font_id: string;
  font_scale: FontScale;
  social_links: SocialLink[];
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface ImageRow {
  id: string;
  portfolio_id: string;
  storage_path: string;
  title: string;
  description: string;
  alt_text: string;
  position: number;
  file_size_bytes: number;
  width: number | null;
  height: number | null;
  folder_id: string | null;
  created_at: string;
}

const PUBLIC_BUCKET = 'portfolio-images';

function publicUrlFor(path: string): string {
  const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function rowToPortfolio(row: PortfolioRow): Portfolio {
  return {
    id: row.id,
    ownerId: row.owner_id,
    portfolioHandle: row.portfolio_handle ?? '',
    isDefault: row.is_default ?? false,
    title: row.title,
    bio: row.bio,
    templateId: row.template_id,
    templateConfig: row.template_config,
    galleryThemeId: row.gallery_theme_id ?? 'ocean-depths',
    folderDisplayMode: row.folder_display_mode ?? 'flat',
    fontId: row.font_id,
    fontScale: row.font_scale,
    socialLinks: row.social_links,
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
    fileSize: row.file_size_bytes,
    width: row.width,
    height: row.height,
    folderId: row.folder_id ?? null,
    createdAt: row.created_at,
  };
}

export async function getMyPortfolios(): Promise<Portfolio[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('owner_id', auth.user.id)
    .order('created_at', { ascending: true });
  if (error || !data) return [];

  return (data as PortfolioRow[]).map(rowToPortfolio);
}

export async function getPortfolioById(id: string): Promise<Portfolio | null> {
  const { data: row, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('id', id)
    .single<PortfolioRow>();
  if (error || !row) return null;
  return rowToPortfolio(row);
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) || 'portfolio'
  );
}

export interface CreatePortfolioInput {
  title: string;
  bio?: string;
  templateId?: string;
}

export async function createPortfolio(input: CreatePortfolioInput): Promise<Portfolio> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not authenticated');

  const portfolioHandle = slugify(input.title);

  const { data, error } = await supabase
    .from('portfolios')
    .insert({
      owner_id: auth.user.id,
      title: input.title,
      bio: input.bio ?? '',
      template_id: input.templateId ?? 'simple-grid',
      portfolio_handle: portfolioHandle,
    })
    .select('*')
    .single<PortfolioRow>();

  if (error || !data) throw new Error(error?.message ?? 'Failed to create portfolio');
  return rowToPortfolio(data);
}

export async function setDefaultPortfolio(portfolioId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not authenticated');

  await supabase
    .from('portfolios')
    .update({ is_default: false })
    .eq('owner_id', auth.user.id)
    .neq('id', portfolioId);

  const { error } = await supabase
    .from('portfolios')
    .update({ is_default: true })
    .eq('id', portfolioId)
    .eq('owner_id', auth.user.id);

  if (error) throw new Error(error.message);
}

export interface PublicPortfolioResult {
  portfolio: Portfolio;
  images: PortfolioImage[];
  folders: ImageFolder[];
}

export async function getPortfolioByHandle(
  username: string,
  portfolioHandle: string,
): Promise<PublicPortfolioResult | null> {
  const { data: row } = await supabase
    .from('portfolios')
    .select('*, users!inner(username)')
    .eq('users.username', username.toLowerCase())
    .eq('portfolio_handle', portfolioHandle.toLowerCase())
    .maybeSingle<PortfolioRow & { users: { username: string } }>();
  if (!row) return null;

  const [imagesResult, folders] = await Promise.all([
    supabase
      .from('images')
      .select('*')
      .eq('portfolio_id', row.id)
      .order('position', { ascending: true }),
    listFolders(row.id),
  ]);

  return {
    portfolio: rowToPortfolio(row),
    images: ((imagesResult.data as ImageRow[] | null) ?? []).map(rowToImage),
    folders,
  };
}

export async function getDefaultPortfolioHandle(username: string): Promise<string | null> {
  const { data } = await supabase
    .from('portfolios')
    .select('portfolio_handle, users!inner(username)')
    .eq('users.username', username.toLowerCase())
    .eq('is_default', true)
    .maybeSingle<{ portfolio_handle: string }>();
  return data?.portfolio_handle ?? null;
}

export interface UpdatePortfolioInput {
  title?: string;
  bio?: string;
  templateId?: string;
  templateConfig?: TemplateConfig;
  galleryThemeId?: string;
  folderDisplayMode?: FolderDisplayMode;
  fontId?: string;
  fontScale?: FontScale;
  socialLinks?: SocialLink[];
  published?: boolean;
  portfolioHandle?: string;
}

export async function updatePortfolio(id: string, patch: UpdatePortfolioInput): Promise<Portfolio> {
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.bio !== undefined) update.bio = patch.bio;
  if (patch.templateId !== undefined) update.template_id = patch.templateId;
  if (patch.templateConfig !== undefined) update.template_config = patch.templateConfig;
  if (patch.galleryThemeId !== undefined) update.gallery_theme_id = patch.galleryThemeId;
  if (patch.folderDisplayMode !== undefined) update.folder_display_mode = patch.folderDisplayMode;
  if (patch.fontId !== undefined) update.font_id = patch.fontId;
  if (patch.fontScale !== undefined) update.font_scale = patch.fontScale;
  if (patch.socialLinks !== undefined) update.social_links = patch.socialLinks;
  if (patch.published !== undefined) update.published = patch.published;
  if (patch.portfolioHandle !== undefined) update.portfolio_handle = patch.portfolioHandle;

  const { data, error } = await supabase
    .from('portfolios')
    .update(update)
    .eq('id', id)
    .select('*')
    .single<PortfolioRow>();
  if (error || !data) throw new Error(error?.message ?? 'Failed to update portfolio');

  return rowToPortfolio(data);
}
