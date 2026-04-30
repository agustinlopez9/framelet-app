import { useEffect } from 'react';
import { getFont, type FontId } from './fonts';

const injected = new Set<string>();

function ensureInjected(googleFamily: string): void {
  if (injected.has(googleFamily)) return;
  if (typeof document === 'undefined') return;
  const id = `font-stylesheet-${googleFamily.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  if (document.getElementById(id)) {
    injected.add(googleFamily);
    return;
  }
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${googleFamily}&display=swap`;
  document.head.appendChild(link);
  injected.add(googleFamily);
}

/**
 * Injects the Google Fonts stylesheet for the given font id once per page,
 * deduped across multiple consumers. No-op for fonts without a `googleFamily`
 * (e.g., the default system stack).
 */
export function useFontStylesheet(fontId: FontId | string | null | undefined): void {
  const font = getFont(fontId);
  useEffect(() => {
    if (font.googleFamily) ensureInjected(font.googleFamily);
  }, [font.googleFamily]);
}
