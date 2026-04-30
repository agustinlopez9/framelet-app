import { afterEach, describe, expect, it } from 'vitest';
import { _resetForTests, get, list, register, DEFAULT_GALLERY_THEME_ID } from './registry';
import type { GalleryTheme } from './types';
import { _resetCatalogForTests, ensureRegistered } from './catalog';
import { hexToHsl, luminance } from './color';

function makeTheme(id: string): GalleryTheme {
  return {
    id,
    name: id,
    description: '',
    palette: { primary: '#000000', secondary: '#000000', accent: '#000000', surface: '#ffffff' },
  };
}

afterEach(() => {
  _resetForTests();
  _resetCatalogForTests();
});

describe('gallery theme registry', () => {
  it('registers and returns a theme by id', () => {
    register(makeTheme('alpha'));
    expect(get('alpha')?.id).toBe('alpha');
  });

  it('returns undefined for unknown ids', () => {
    expect(get('does-not-exist')).toBeUndefined();
  });

  it('lists themes in registration order', () => {
    register(makeTheme('alpha'));
    register(makeTheme('beta'));
    register(makeTheme('gamma'));
    expect(list().map((t) => t.id)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('throws on duplicate id', () => {
    register(makeTheme('dup'));
    expect(() => register(makeTheme('dup'))).toThrow(/Duplicate gallery theme id/);
  });

  it('list returns a copy that does not mutate the registry', () => {
    register(makeTheme('alpha'));
    const copy = list();
    copy.push(makeTheme('extra'));
    expect(list()).toHaveLength(1);
  });
});

describe('catalog', () => {
  const REGISTERED_THEMES = [
    'ocean-depths',
    'modern-minimalist',
    'arctic-frost',
    'desert-rose',
    'midnight-galaxy',
    'carbon-crimson',
    'showroom-amber',
    'atelier-ivory',
    'studio-mono',
  ];

  const REMOVED_THEMES = [
    'sunset-boulevard',
    'forest-canopy',
    'golden-hour',
    'botanical-garden',
  ];

  it('ensureRegistered registers every catalog theme including the default', () => {
    ensureRegistered();
    expect(get(DEFAULT_GALLERY_THEME_ID)?.id).toBe('ocean-depths');
    const ids = list().map((t) => t.id);
    for (const id of REGISTERED_THEMES) {
      expect(ids).toContain(id);
    }
    expect(list()).toHaveLength(REGISTERED_THEMES.length);
  });

  it('registers the four automotive-styled themes', () => {
    ensureRegistered();
    expect(get('carbon-crimson')?.id).toBe('carbon-crimson');
    expect(get('showroom-amber')?.id).toBe('showroom-amber');
    expect(get('atelier-ivory')?.id).toBe('atelier-ivory');
    expect(get('studio-mono')?.id).toBe('studio-mono');
  });

  it('does not include removed or non-existent themes', () => {
    ensureRegistered();
    REMOVED_THEMES.forEach((id) => expect(get(id)).toBeUndefined());
    expect(get('tech-innovation')).toBeUndefined();
  });

  it('every catalog theme ships a gradient palette', () => {
    ensureRegistered();
    for (const theme of list()) {
      expect(theme.gradient, `${theme.id} should declare a gradient`).toBeDefined();
      expect(theme.gradient!.from).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.gradient!.to).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('every gradient stays subtle (≤6pp lightness delta)', () => {
    ensureRegistered();
    for (const theme of list()) {
      const from = hexToHsl(theme.gradient!.from);
      const to = hexToHsl(theme.gradient!.to);
      const delta = Math.abs(from.l - to.l);
      expect(delta, `${theme.id} gradient delta = ${delta}`).toBeLessThanOrEqual(6);
    }
  });

  it('body type passes WCAG AA against each gradient mid-point', () => {
    ensureRegistered();
    for (const theme of list()) {
      // Mid-point of the gradient: average the from/to luminance.
      const lFrom = luminance(theme.gradient!.from);
      const lTo = luminance(theme.gradient!.to);
      const lMid = (lFrom + lTo) / 2;
      const lAccent = luminance(theme.palette.accent);
      const [hi, lo] = lAccent > lMid ? [lAccent, lMid] : [lMid, lAccent];
      const ratio = (hi + 0.05) / (lo + 0.05);
      expect(ratio, `${theme.id} body contrast = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
