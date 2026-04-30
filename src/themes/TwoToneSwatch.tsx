import { cn } from '@/lib/utils';

interface TwoToneSwatchProps {
  /** The heading tone (darkest of the theme). */
  heading: string;
  /** The background tone (the theme's complementary surface color). */
  bg: string;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export function TwoToneSwatch({
  heading,
  bg,
  size = 56,
  className,
  ariaLabel,
}: TwoToneSwatchProps) {
  return (
    <span
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      className={cn('inline-block rounded-full ring-1 ring-foreground/10', className)}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${heading} 0%, ${heading} 50%, ${bg} 50%, ${bg} 100%)`,
      }}
    />
  );
}
