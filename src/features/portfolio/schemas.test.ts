import { describe, expect, it } from 'vitest';
import { imageMetadataSchema, portfolioMetadataSchema } from './schemas';

describe('portfolioMetadataSchema', () => {
  it('rejects an empty title', () => {
    expect(
      portfolioMetadataSchema.safeParse({ title: '', bio: '', galleryThemeId: 'ocean-depths' })
        .success,
    ).toBe(false);
  });
  it('rejects a title longer than 80 chars', () => {
    expect(
      portfolioMetadataSchema.safeParse({
        title: 'x'.repeat(81),
        bio: '',
        galleryThemeId: 'ocean-depths',
      }).success,
    ).toBe(false);
  });
  it('rejects a bio longer than 500 chars', () => {
    expect(
      portfolioMetadataSchema.safeParse({
        title: 'ok',
        bio: 'b'.repeat(501),
        galleryThemeId: 'ocean-depths',
      }).success,
    ).toBe(false);
  });
  it('accepts valid input', () => {
    expect(
      portfolioMetadataSchema.safeParse({
        title: 'My work',
        bio: 'About me',
        galleryThemeId: 'ocean-depths',
      }).success,
    ).toBe(true);
  });
});

describe('imageMetadataSchema', () => {
  it('rejects alt text over 200 chars', () => {
    expect(
      imageMetadataSchema.safeParse({ title: '', description: '', altText: 'a'.repeat(201) })
        .success,
    ).toBe(false);
  });
  it('rejects title over 80 chars', () => {
    expect(
      imageMetadataSchema.safeParse({ title: 't'.repeat(81), description: '', altText: '' })
        .success,
    ).toBe(false);
  });
  it('accepts empty fields', () => {
    expect(imageMetadataSchema.safeParse({ title: '', description: '', altText: '' }).success).toBe(
      true,
    );
  });
});
