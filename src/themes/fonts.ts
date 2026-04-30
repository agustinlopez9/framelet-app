export type FontId = 'default' | 'elegant' | 'modern' | 'tech' | 'cursive';

export interface FontEntry {
  id: FontId;
  label: string;
  description: string;
  stack: string;
  googleFamily?: string;
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
  },
  {
    id: 'cursive',
    label: 'Cursive (subtle)',
    description: 'Handwritten — understated, not flashy.',
    stack: '"Caveat", "Comic Sans MS", cursive',
    googleFamily: 'Caveat:wght@400;500;600;700',
  },
];

export const DEFAULT_FONT_ID: FontId = 'default';

export function getFont(id: string | null | undefined): FontEntry {
  return fontCatalog.find((f) => f.id === id) ?? fontCatalog[0];
}
