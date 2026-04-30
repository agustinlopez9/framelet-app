import { useEffect, useRef, useState } from 'react';

interface UseFadeInOnScrollOptions {
  /**
   * Milliseconds to wait after the element first enters the viewport before
   * applying the "shown" state. Used to chain entrance animations across
   * sibling items (e.g., grid images entering with a stagger).
   */
  delayMs?: number;
}

interface UseFadeInOnScrollResult<T extends HTMLElement> {
  ref: (node: T | null) => void;
  shown: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Returns a ref + boolean that flips to `true` the first time the element
 * intersects the viewport. Used to drive subtle entrance animations
 * (fade-in, slide-up). When `prefers-reduced-motion: reduce` is set, the
 * boolean is always `true` so consumers can skip the animation entirely.
 */
export function useFadeInOnScroll<T extends HTMLElement = HTMLElement>(
  { delayMs = 0 }: UseFadeInOnScrollOptions = {},
): UseFadeInOnScrollResult<T> {
  const [shown, setShown] = useState<boolean>(() => prefersReducedMotion());
  const nodeRef = useRef<T | null>(null);

  const setRef = (node: T | null) => {
    nodeRef.current = node;
  };

  useEffect(() => {
    if (shown) return;
    const node = nodeRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (delayMs > 0) {
              window.setTimeout(() => setShown(true), delayMs);
            } else {
              setShown(true);
            }
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delayMs, shown]);

  return { ref: setRef, shown };
}
