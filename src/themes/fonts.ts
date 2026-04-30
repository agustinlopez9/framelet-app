export type FontId = 'default' | 'elegant' | 'modern' | 'tech' | 'cursive';

export interface FontEntry {
  id: FontId;
  label: string;
  description: string;
  stack: string;
  googleFamily?: string;
  /**
   * Multiplier applied on top of the portfolio's `fontScale` so fonts that
   * render visually larger or smaller at the same pixel size are normalised
   * across families. Default 1.0.
   */
  scaleAdjust?: number;
}

export const fontCatalog: FontEntry[] = [
  {
    id: 'default',
    label: 'Default',
    description: 'The app default — system sans.',
    stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  {
    id: 'elegant',
    label: 'Elegant',
    description: 'Refined display serif.',
    stack: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
    googleFamily: 'Cormorant+Garamond:wght@400;500;600;700',
    // Cormorant runs visually small; nudge up a touch.
    scaleAdjust: 1.05,
  },
  {
    id: 'modern',
    label: 'Modern',
    description: 'Contemporary geometric sans.',
    stack: '"Manrope", system-ui, sans-serif',
    googleFamily: 'Manrope:wght@400;500;600;700;800',
  },
  {
    id: 'tech',
    label: 'Tech / Hacky',
    description: 'Monospace with arcade vibe.',
    stack: '"JetBrains Mono", ui-monospace, "Courier New", monospace',
    googleFamily: 'JetBrains+Mono:wght@400;500;600;700',
    // Monospace fonts read narrower per glyph; bump slightly so body type
    // doesn't feel cramped relative to the sans options.
    scaleAdjust: 0.98,
  },
  {
    // Slot id stays `cursive` for backwards compatibility with existing
    // portfolios; the family is now a calmer humanist display serif.
    id: 'cursive',
    label: 'Display Serif',
    description: 'Calm humanist serif — display weight without the flourish.',
    stack: '"Marcellus", Georgia, "Times New Roman", serif',
    googleFamily: 'Marcellus:wght@400',
    // Marcellus renders a touch large at the same px size; gentle pull-back.
    scaleAdjust: 0.96,
  },
];

export const DEFAULT_FONT_ID: FontId = 'default';

export function getFont(id: string | null | undefined): FontEntry {
  return fontCatalog.find((f) => f.id === id) ?? fontCatalog[0];
}
