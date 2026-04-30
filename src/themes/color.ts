export interface Hsl {
  h: number;
  s: number;
  l: number;
}

/** Parse a `#rrggbb` (or `#rgb`) hex string into normalised RGB in [0, 1]. */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (cleaned.length !== 6) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  return { r, g, b };
}

export function hexToHsl(hex: string): Hsl {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return {
    h: round(h),
    s: round(s * 100),
    l: round(l * 100),
  };
}

/** Format an HSL triple as the shadcn-style string consumed by `hsl(var(--token))`. */
export function hslString(hsl: Hsl): string {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}

export function hexToHslString(hex: string): string {
  return hslString(hexToHsl(hex));
}

/** Relative luminance per WCAG 2.x for picking foregrounds by contrast. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Returns whichever of the two hex colors has higher contrast against `bg`. */
export function pickForeground(bg: string, light: string, dark: string): string {
  const bgLum = luminance(bg);
  const lightContrast = contrast(bgLum, luminance(light));
  const darkContrast = contrast(bgLum, luminance(dark));
  return darkContrast >= lightContrast ? dark : light;
}

function contrast(a: number, b: number): number {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Returns an HSL string with the lightness shifted by `delta` percentage points,
 * clamped to [0, 100]. Hue and saturation are preserved so the result stays in
 * the same color family — useful for deriving a description tone from the
 * darkest tone of a theme.
 */
export function lighten(hex: string, delta: number): string {
  const hsl = hexToHsl(hex);
  return hslString({
    h: hsl.h,
    s: hsl.s,
    l: clamp(hsl.l + delta, 0, 100),
  });
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
