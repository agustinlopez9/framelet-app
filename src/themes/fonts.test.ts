import { describe, expect, it } from 'vitest';
import { fontCatalog, getFont, DEFAULT_FONT_ID } from './fonts';

describe('font catalog', () => {
  it('exposes exactly five entries with the required ids', () => {
    expect(fontCatalog).toHaveLength(5);
    expect(fontCatalog.map((f) => f.id)).toEqual([
      'default',
      'elegant',
      'modern',
      'tech',
      'cursive',
    ]);
  });

  it('every entry has a label and a font stack', () => {
    for (const font of fontCatalog) {
      expect(font.label.length).toBeGreaterThan(0);
      expect(font.stack.length).toBeGreaterThan(0);
    }
  });

  it('default is the first entry and matches DEFAULT_FONT_ID', () => {
    expect(fontCatalog[0].id).toBe(DEFAULT_FONT_ID);
    expect(DEFAULT_FONT_ID).toBe('default');
  });

  it('default has no Google Family (uses system stack)', () => {
    expect(fontCatalog[0].googleFamily).toBeUndefined();
  });

  it('non-default fonts each declare a Google Family', () => {
    for (const font of fontCatalog.slice(1)) {
      expect(font.googleFamily).toBeTruthy();
    }
  });

  it('getFont returns the named entry, falling back to default for unknown ids', () => {
    expect(getFont('elegant').id).toBe('elegant');
    expect(getFont('not-a-real-font').id).toBe('default');
    expect(getFont(undefined).id).toBe('default');
    expect(getFont(null).id).toBe('default');
  });
});
