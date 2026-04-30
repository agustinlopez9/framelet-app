import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FigureProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

export function Figure({ children, className, onClick, ariaLabel }: FigureProps) {
  const interactive = Boolean(onClick);
  const base = 'relative overflow-hidden rounded-lg shadow-sm ring-1 ring-foreground/10 bg-card';

  if (!interactive) {
    return <figure className={cn(base, className)}>{children}</figure>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? 'Open image'}
      className={cn(
        base,
        'block w-full cursor-zoom-in p-0 text-left transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className,
      )}
    >
      {children}
    </button>
  );
}
