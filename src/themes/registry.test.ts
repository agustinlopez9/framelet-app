import { afterEach, describe, expect, it } from 'vitest';
import { _resetForTests, get, list, register, DEFAULT_GALLERY_THEME_ID } from './registry';
import type { GalleryTheme } from './types';
import { ensureRegistered } from './catalog';

function makeTheme(id: string): GalleryTheme {
  return {
    id,
    name: id,
    description: '',
    palette: { primary: '#000000', secondary: '#000000', accent: '#000000', surface: '#ffffff' },
  };
}

afterEach(() => _resetForTests());

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
  const SURVIVING_THEMES = [
    'ocean-depths',
    'modern-minimalist',
    'arctic-frost',
    'desert-rose',
    'midnight-galaxy',
  ];

  const REMOVED_THEMES = [
    'sunset-boulevard',
    'forest-canopy',
    'golden-hour',
    'botanical-garden',
  ];

  it('registers exactly the surviving themes including the default', () => {
    SURVIVING_THEMES.forEach((id) =>
      register({
        id,
        name: id,
        description: '',
        palette: { primary: '#000', secondary: '#000', accent: '#000', surface: '#fff' },
      }),
    );
    void ensureRegistered;
    expect(get(DEFAULT_GALLERY_THEME_ID)?.id).toBe('ocean-depths');
    expect(list()).toHaveLength(SURVIVING_THEMES.length);
  });

  it('does not include removed or non-existent themes', () => {
    SURVIVING_THEMES.forEach((id) =>
      register({
        id,
        name: id,
        description: '',
        palette: { primary: '#000', secondary: '#000', accent: '#000', surface: '#fff' },
      }),
    );
    REMOVED_THEMES.forEach((id) => expect(get(id)).toBeUndefined());
    expect(get('tech-innovation')).toBeUndefined();
  });
});
