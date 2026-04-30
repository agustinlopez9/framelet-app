export interface GalleryThemePalette {
  /** CTA / accent color (buttons, rings). */
  primary: string;
  /** Muted / secondary background color. */
  secondary: string;
  /** Body text / strong-foreground color. */
  accent: string;
  /** Page background color. */
  surface: string;
}

/**
 * Subtle background gradient used as the page background under `ThemeScope`.
 * `from` is the top of the gradient; `to` is the bottom. To stay subtle, the
 * perceived lightness delta should be ≤6 percentage points. Optional in
 * TypeScript only — the catalog ships every entry with one; the optionality
 * is for forwards compatibility with externally-registered themes (when
 * absent, `ThemeScope` derives a gradient from `surface`).
 */
export interface GalleryThemeGradient {
  from: string;
  to: string;
}

export interface GalleryTheme {
  id: string;
  name: string;
  description: string;
  palette: GalleryThemePalette;
  gradient?: GalleryThemeGradient;
}
