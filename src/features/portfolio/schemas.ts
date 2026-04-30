import { z } from 'zod';

export const FONT_IDS = ['default', 'elegant', 'modern', 'tech', 'cursive'] as const;
export const FOLDER_DISPLAY_MODES = ['tabs', 'flat'] as const;

export const portfolioMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(80, 'Title must be 80 characters or fewer.'),
  bio: z.string().max(500, 'Bio must be 500 characters or fewer.'),
  galleryThemeId: z.string().min(1),
  fontId: z.enum(FONT_IDS).default('default'),
  folderDisplayMode: z.enum(FOLDER_DISPLAY_MODES).default('flat'),
});

export const imageMetadataSchema = z.object({
  title: z.string().max(80, 'Title must be 80 characters or fewer.'),
  description: z.string(),
  altText: z.string().max(200, 'Alt text must be 200 characters or fewer.'),
  folderId: z.string().nullable().default(null),
});

export type PortfolioMetadataValues = z.infer<typeof portfolioMetadataSchema>;
export type ImageMetadataValues = z.infer<typeof imageMetadataSchema>;
