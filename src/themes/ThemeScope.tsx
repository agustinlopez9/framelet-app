import type { CSSProperties, ReactNode } from 'react';
import { useMemo } from 'react';
import { DEFAULT_GALLERY_THEME_ID, get } from './registry';
import { hexToHslString, lighten, pickForeground } from './color';
import { getFont } from './fonts';
import { useFontStylesheet } from './useFontStylesheet';

interface ThemeScopeProps {
  themeId: string;
  fontId?: string | null;
  className?: string;
  children: ReactNode;
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

export function ThemeScope({ themeId, fontId, className, children }: ThemeScopeProps) {
  useFontStylesheet(fontId);
  const font = getFont(fontId);
  const style = useMemo<CSSProperties>(() => {
    const theme = get(themeId) ?? get(DEFAULT_GALLERY_THEME_ID);
    if (!theme) return {};
    if (themeId !== theme.id) {
      console.warn(`Unknown gallery theme "${themeId}", falling back to "${theme.id}".`);
    }

    const { primary, secondary, accent, surface } = theme.palette;

    const surfaceHsl = hexToHslString(surface);
    const accentHsl = hexToHslString(accent);
    const primaryHsl = hexToHslString(primary);
    const secondaryHsl = hexToHslString(secondary);
    const descriptionHsl = lighten(accent, 30);

    const onPrimary = hexToHslString(pickForeground(primary, surface, accent));
    const onSecondary = hexToHslString(pickForeground(secondary, surface, accent));

    return {
      // Role-explicit gallery tokens.
      '--gallery-heading': accentHsl,
      '--gallery-description': descriptionHsl,
      '--gallery-bg': secondaryHsl,
      '--gallery-accent': primaryHsl,
      '--portfolio-font': font.stack,
      fontFamily: 'var(--portfolio-font, system-ui)',

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
  }, [themeId, font.stack]);

  return (
    <div data-theme-scope={themeId} className={className} style={style}>
      {children}
    </div>
  );
}
