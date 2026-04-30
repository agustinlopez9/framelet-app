import { register } from './registry';
import type { GalleryTheme } from './types';

// Palettes mirror `theme-showcase.pdf`. Slot conventions:
//   primary  → CTA / ring color
//   secondary→ muted surface, soft accent
//   accent   → body text (must read clearly on `surface`)
//   surface  → page background

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
};

const ALL: GalleryTheme[] = [
  oceanDepths,
  modernMinimalist,
  arcticFrost,
  desertRose,
  midnightGalaxy,
];

let initialized = false;
export function ensureRegistered(): void {
  if (initialized) return;
  for (const theme of ALL) register(theme);
  initialized = true;
}
