import type { GalleryTheme } from './types';

const registry: GalleryTheme[] = [];
const ids = new Set<string>();

export function register(theme: GalleryTheme): void {
  if (ids.has(theme.id)) {
    throw new Error(`Duplicate gallery theme id: "${theme.id}"`);
  }
  ids.add(theme.id);
  registry.push(theme);
}

export function get(id: string): GalleryTheme | undefined {
  return registry.find((t) => t.id === id);
}

export function list(): GalleryTheme[] {
  return [...registry];
}

export const DEFAULT_GALLERY_THEME_ID = 'ocean-depths';

/** For tests: clears the registry. */
export function _resetForTests(): void {
  registry.length = 0;
  ids.clear();
}
