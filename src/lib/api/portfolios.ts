import { supabase } from '@/lib/supabase';
import type {
  FolderDisplayMode,
  FontScale,
  ImageFolder,
  Portfolio,
  PortfolioImage,
  SocialLink,
  TemplateConfig,
} from '@/types';
import { listFolders } from './folders';

interface PortfolioRow {
  id: string;
  owner_id: string;
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

function rowToPortfolio(row: PortfolioRow, handle: string): Portfolio {
  return {
    id: row.id,
    ownerId: row.owner_id,
    handle,
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
    width: row.width,
    height: row.height,
    folderId: row.folder_id ?? null,
    createdAt: row.created_at,
  };
}

export async function getMyPortfolio(): Promise<Portfolio | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: row, error } = await supabase
    .from('portfolios')
    .select('*, users!owner_id(handle)')
    .eq('owner_id', auth.user.id)
    .single<PortfolioRow & { users: { handle: string } }>();
  if (error || !row) return null;

  return rowToPortfolio(row, row.users.handle);
}

export interface PublicPortfolioResult {
  portfolio: Portfolio;
  images: PortfolioImage[];
  folders: ImageFolder[];
}

export async function getPortfolioByHandle(handle: string): Promise<PublicPortfolioResult | null> {
  const { data: row } = await supabase
    .from('portfolios')
    .select('*, users!inner(handle)')
    .eq('users.handle', handle.toLowerCase())
    .maybeSingle<PortfolioRow & { users: { handle: string } }>();
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
    portfolio: rowToPortfolio(row, row.users.handle),
    images: ((imagesResult.data as ImageRow[] | null) ?? []).map(rowToImage),
    folders,
  };
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
