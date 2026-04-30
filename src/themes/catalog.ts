import { register } from './registry';
import type { GalleryTheme } from './types';

// Palettes mirror `theme-showcase.pdf`. Slot conventions:
//   primary  → CTA / ring color
//   secondary→ muted surface, soft accent
//   accent   → body text (must read clearly on `surface`)
//   surface  → page background
//
// Every entry ships a `gradient` (subtle ≤6% lightness delta) used as the
// 180° page background under `ThemeScope`. Body text contrast is verified
// against the gradient mid-point.

export const oceanDepths: GalleryTheme = {
  id: 'ocean-depths',
  name: 'Ocean Depths',
  description: 'A professional and calming maritime theme.',
  palette: {
    primary: '#2d8b8b', // Teal
    secondary: '#a8dadc', // Seafoam
    accent: '#1a2332', // Deep Navy
    surface: '#f1faee', // Cream
  },
  gradient: { from: '#f1faee', to: '#e7f3e1' },
};

export const modernMinimalist: GalleryTheme = {
  id: 'modern-minimalist',
  name: 'Modern Minimalist',
  description: 'Clean and contemporary grayscale.',
  palette: {
    primary: '#36454f', // Charcoal
    secondary: '#d3d3d3', // Light Gray
    accent: '#1f2933', // Near-black for body text
    surface: '#ffffff', // White
  },
  gradient: { from: '#ffffff', to: '#f4f4f6' },
};

export const arcticFrost: GalleryTheme = {
  id: 'arctic-frost',
  name: 'Arctic Frost',
  description: 'Cool and crisp winter-inspired theme.',
  palette: {
    primary: '#4a6fa5', // Steel Blue
    secondary: '#d4e4f7', // Ice Blue
    accent: '#1f2d4a', // Darkened steel for body text
    surface: '#fafafa', // Crisp White
  },
  gradient: { from: '#fafcff', to: '#eef1f7' },
};

export const desertRose: GalleryTheme = {
  id: 'desert-rose',
  name: 'Desert Rose',
  description: 'Soft and sophisticated dusty tones.',
  palette: {
    primary: '#b87d6d', // Clay
    secondary: '#d4a5a5', // Dusty Rose
    accent: '#5d2e46', // Deep Burgundy
    surface: '#f3e5d6', // Lightened sand for readability
  },
  gradient: { from: '#f6e9dc', to: '#ecdccd' },
};

export const midnightGalaxy: GalleryTheme = {
  id: 'midnight-galaxy',
  name: 'Midnight Galaxy',
  description: 'Dramatic and cosmic deep tones.',
  palette: {
    primary: '#4a4e8f', // Cosmic Blue
    secondary: '#a490c2', // Lavender
    accent: '#2b1e3e', // Deep Purple
    surface: '#ecebf7', // Lightened silver for readability
  },
  gradient: { from: '#f1effa', to: '#e3e1f1' },
};

// Automotive-styled themes tuned for car-portfolio / dealership pages.

export const carbonCrimson: GalleryTheme = {
  id: 'carbon-crimson',
  name: 'Carbon Crimson',
  description: 'Bright crimson on carbon black — a showroom at dusk.',
  palette: {
    primary: '#e03a3a', // Brighter, vivid red for type accents
    secondary: '#3b1b1f', // Oxblood shadow
    accent: '#f4ece3', // Warm off-white body type
    surface: '#0e0f12', // Deep carbon black
  },
  gradient: { from: '#14151a', to: '#0b0c10' },
};

export const showroomAmber: GalleryTheme = {
  id: 'showroom-amber',
  name: 'Showroom Amber',
  description: 'Saturated amber accent on carbon black — concession lighting after hours.',
  palette: {
    primary: '#f0b845', // Saturated amber
    secondary: '#3a2c14', // Deep brown
    accent: '#f4ece3', // Warm off-white body type
    surface: '#0e0f12', // Deep carbon black
  },
  gradient: { from: '#14151a', to: '#0b0c10' },
};

export const atelierIvory: GalleryTheme = {
  id: 'atelier-ivory',
  name: 'Atelier Ivory',
  description: 'Warm ivory surface with cream-tinted type — the dealership atelier.',
  palette: {
    primary: '#332720', // Espresso
    secondary: '#d8c9a9', // Sandstone
    accent: '#5a4a3a', // Warm cream-tinted dark sand (composes with ivory)
    surface: '#f6efe1', // Warm ivory
  },
  gradient: { from: '#fcf6e7', to: '#f1e8d4' },
};

export const studioMono: GalleryTheme = {
  id: 'studio-mono',
  name: 'Studio Mono',
  description: 'Bright paper-white with deep slate type.',
  palette: {
    primary: '#1f2330', // Slate
    secondary: '#e4e7ee', // Cool gray
    accent: '#0f1218', // Near-black body type
    surface: '#ffffff', // Paper white (distinct from Modern Minimalist's off-white)
  },
  gradient: { from: '#ffffff', to: '#f0f2f6' },
};

const ALL: GalleryTheme[] = [
  oceanDepths,
  modernMinimalist,
  arcticFrost,
  desertRose,
  midnightGalaxy,
  carbonCrimson,
  showroomAmber,
  atelierIvory,
  studioMono,
];

let initialized = false;
export function ensureRegistered(): void {
  if (initialized) return;
  for (const theme of ALL) register(theme);
  initialized = true;
}

/** For tests: clears the initialized flag so a fresh registry can be seeded. */
export function _resetCatalogForTests(): void {
  initialized = false;
}
