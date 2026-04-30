import { z } from 'zod';

export const FONT_IDS = ['default', 'elegant', 'modern', 'tech', 'cursive'] as const;
export const FOLDER_DISPLAY_MODES = ['tabs', 'flat'] as const;
export const FONT_SCALES = ['small', 'regular', 'large'] as const;
export const SOCIAL_PLATFORMS = [
  'instagram',
  'facebook',
  'twitter',
  'youtube',
  'tiktok',
  'linkedin',
  'pinterest',
  'other',
] as const;

export const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  url: z
    .string()
    .trim()
    .min(1, 'URL is required.')
    .max(500, 'URL is too long.')
    .regex(/^https?:\/\//i, 'URL must start with http:// or https://'),
  label: z.string().max(60, 'Label must be 60 characters or fewer.').optional(),
});

export const portfolioMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(80, 'Title must be 80 characters or fewer.'),
  bio: z.string().max(500, 'Bio must be 500 characters or fewer.'),
  galleryThemeId: z.string().min(1),
  fontId: z.enum(FONT_IDS).default('default'),
  fontScale: z.enum(FONT_SCALES).default('regular'),
  folderDisplayMode: z.enum(FOLDER_DISPLAY_MODES).default('flat'),
  socialLinks: z.array(socialLinkSchema).default([]),
});

export const imageMetadataSchema = z.object({
  title: z.string().max(80, 'Title must be 80 characters or fewer.'),
  description: z.string(),
  altText: z.string().max(200, 'Alt text must be 200 characters or fewer.'),
  folderId: z.string().nullable().default(null),
});

export type PortfolioMetadataValues = z.infer<typeof portfolioMetadataSchema>;
export type ImageMetadataValues = z.infer<typeof imageMetadataSchema>;
