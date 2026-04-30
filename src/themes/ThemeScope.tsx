import type { CSSProperties, ReactNode } from 'react';
import { useMemo } from 'react';
import { DEFAULT_GALLERY_THEME_ID, get } from './registry';
import { hexToHsl, hexToHslString, lighten, luminance, pickForeground } from './color';
import { getFont } from './fonts';
import { useFontStylesheet } from './useFontStylesheet';
import type { FontScale } from '@/types';

interface ThemeScopeProps {
  themeId: string;
  fontId?: string | null;
  fontScale?: FontScale | null;
  className?: string;
  children: ReactNode;
}

const FONT_SCALE_BASE: Record<FontScale, number> = {
  small: 0.9,
  regular: 1.0,
  large: 1.1,
};

function deriveGradient(surface: string): { from: string; to: string } {
  // Subtle ±3% lightness shift around the surface so the page reads as
  // depth, not duotone. For dark surfaces lighten the top; for light
  // surfaces darken the bottom.
  const isLight = luminance(surface) > 0.5;
  if (isLight) {
    return { from: surface, to: lightenHex(surface, -3) };
  }
  return { from: lightenHex(surface, 3), to: surface };
}

function lightenHex(hex: string, deltaPct: number): string {
  // The shared `lighten` helper returns an HSL string; we need a hex value
  // for inline gradient stops. Reimplement the small shift directly.
  const hsl = hexToHsl(hex);
  const l = Math.min(100, Math.max(0, hsl.l + deltaPct));
  return hslToHexString({ h: hsl.h, s: hsl.s, l });
}

function hslToHexString({ h, s, l }: { h: number; s: number; l: number }): string {
  // Convert HSL (h: 0-360, s/l: 0-100) back to a #rrggbb hex.
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = ln - c / 2;
  const toByte = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

// Role mapping (gallery semantic roles → palette slots):
//   heading      ← accent              (darkest tone, used for titles)
//   description  ← lighten(accent,+30) (same hue, softer; used for captions/bios)
//   bg           ← secondary           (the complementary tone — page surface)
//   accent       ← primary             (CTA / ring)
//
// Shadcn tokens are wired so theme-agnostic templates pick up the new roles
// automatically:
//   --foreground             ← accent          (text-foreground = headings)
//   --muted-foreground       ← description     (text-muted-foreground = description)
//   --background, --popover  ← secondary       (gallery surface)
//   --card                   ← surface         (kept for visual depth on card surfaces)
//   --primary, --ring, --accent ← primary
// Plus role-specific aliases for components that want to be explicit.

export function ThemeScope({ themeId, fontId, fontScale, className, children }: ThemeScopeProps) {
  useFontStylesheet(fontId);
  const font = getFont(fontId);
  const style = useMemo<CSSProperties>(() => {
    const theme = get(themeId) ?? get(DEFAULT_GALLERY_THEME_ID);
    if (!theme) return {};
    if (themeId !== theme.id) {
      console.warn(`Unknown gallery theme "${themeId}", falling back to "${theme.id}".`);
    }

    const { primary, secondary, accent, surface } = theme.palette;
    const gradient = theme.gradient ?? deriveGradient(surface);

    const surfaceHsl = hexToHslString(surface);
    const accentHsl = hexToHslString(accent);
    const primaryHsl = hexToHslString(primary);
    const secondaryHsl = hexToHslString(secondary);
    const descriptionHsl = lighten(accent, 30);

    const onPrimary = hexToHslString(pickForeground(primary, surface, accent));
    const onSecondary = hexToHslString(pickForeground(secondary, surface, accent));

    const scaleBase = FONT_SCALE_BASE[fontScale ?? 'regular'];
    const scaleAdjust = font.scaleAdjust ?? 1.0;
    const portfolioFontScale = (scaleBase * scaleAdjust).toFixed(3);

    return {
      // Role-explicit gallery tokens.
      '--gallery-heading': accentHsl,
      '--gallery-description': descriptionHsl,
      '--gallery-bg': secondaryHsl,
      '--gallery-accent': primaryHsl,
      '--gallery-bg-gradient': `linear-gradient(180deg, ${gradient.from}, ${gradient.to})`,
      '--portfolio-font': font.stack,
      '--portfolio-font-scale': portfolioFontScale,
      fontFamily: 'var(--portfolio-font, system-ui)',
      background: 'var(--gallery-bg-gradient)',

      // Shadcn tokens — re-pointed to gallery roles so existing utilities work.
      '--background': secondaryHsl,
      '--foreground': accentHsl,
      '--card': surfaceHsl,
      '--card-foreground': accentHsl,
      '--popover': surfaceHsl,
      '--popover-foreground': accentHsl,
      '--primary': primaryHsl,
      '--primary-foreground': onPrimary,
      '--secondary': secondaryHsl,
      '--secondary-foreground': onSecondary,
      '--muted': secondaryHsl,
      '--muted-foreground': descriptionHsl,
      '--accent': primaryHsl,
      '--accent-foreground': onPrimary,
      '--border': secondaryHsl,
      '--input': secondaryHsl,
      '--ring': primaryHsl,
    } as CSSProperties;
  }, [themeId, font.stack, font.scaleAdjust, fontScale]);

  return (
    <div data-theme-scope={themeId} className={className} style={style}>
      {children}
    </div>
  );
}
