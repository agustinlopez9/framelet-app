import { z } from 'zod';

export const portfolioMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(80, 'Title must be 80 characters or fewer.'),
  bio: z.string().max(500, 'Bio must be 500 characters or fewer.'),
});

export const imageMetadataSchema = z.object({
  title: z.string().max(80, 'Title must be 80 characters or fewer.'),
  description: z.string(),
  altText: z.string().max(200, 'Alt text must be 200 characters or fewer.'),
});

export type PortfolioMetadataValues = z.infer<typeof portfolioMetadataSchema>;
export type ImageMetadataValues = z.infer<typeof imageMetadataSchema>;
