export type FolderDisplayMode = 'tabs' | 'flat';

export type FontScale = 'small' | 'regular' | 'large';

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'youtube'
  | 'tiktok'
  | 'linkedin'
  | 'pinterest'
  | 'other';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  /** Used as the accessible name when `platform === 'other'`. */
  label?: string;
}

export type TemplateConfig = Record<string, unknown>;

export interface Portfolio {
  id: string;
  ownerId: string;
  portfolioHandle: string;
  isDefault: boolean;
  title: string;
  bio: string;
  templateId: string;
  templateConfig: TemplateConfig;
  galleryThemeId: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  folderDisplayMode?: FolderDisplayMode;
  fontId: string;
  fontScale: FontScale;
  socialLinks: SocialLink[];
}

export interface PortfolioImage {
  id: string;
  portfolioId: string;
  storagePath: string;
  url: string;
  title: string;
  description: string;
  altText: string;
  position: number;
  fileSize: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  folderId?: string | null;
}

export interface Video {
  id: string;
  portfolioId: string;
  storagePath: string;
  url: string;
  title: string;
  description: string;
  position: number;
  durationSeconds: number | null;
  thumbnailPath: string | null;
  fileSize: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  updatedAt: string;
}

export type MediaItem =
  | (PortfolioImage & { mediaType: 'image' })
  | (Video & { mediaType: 'video' });

export interface ImageFolder {
  id: string;
  portfolioId: string;
  name: string;
  position: number;
  hidden: boolean;
  createdAt: string;
}
