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

export interface GalleryTheme {
  id: string;
  name: string;
  description: string;
  palette: GalleryThemePalette;
}
