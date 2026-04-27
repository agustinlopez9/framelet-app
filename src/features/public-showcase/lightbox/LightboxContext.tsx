import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { PortfolioImage } from '@/types';

interface LightboxState {
  isOpen: boolean;
  activeIndex: number;
  images: PortfolioImage[];
}

interface LightboxApi {
  state: LightboxState;
  openAt: (index: number, trigger?: HTMLElement | null) => void;
  close: () => void;
  goNext: () => void;
  goPrev: () => void;
  goTo: (index: number) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
}

const LightboxContext = createContext<LightboxApi | null>(null);

interface LightboxProviderProps {
  images: PortfolioImage[];
  children: ReactNode;
}

export function LightboxProvider({ images, children }: LightboxProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openAt = useCallback((index: number, trigger: HTMLElement | null = null) => {
    if (index < 0 || index >= images.length) return;
    triggerRef.current = trigger;
    setActiveIndex(index);
    setIsOpen(true);
  }, [images.length]);

  const close = useCallback(() => {
    setIsOpen(false);
    const t = triggerRef.current;
    triggerRef.current = null;
    queueMicrotask(() => t?.focus?.());
  }, []);

  const goTo = useCallback((index: number) => {
    if (images.length === 0) return;
    const wrapped = ((index % images.length) + images.length) % images.length;
    setActiveIndex(wrapped);
  }, [images.length]);

  const goNext = useCallback(() => {
    if (images.length === 0) return;
    setActiveIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    if (images.length === 0) return;
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const value = useMemo<LightboxApi>(() => ({
    state: { isOpen, activeIndex, images },
    openAt,
    close,
    goNext,
    goPrev,
    goTo,
    triggerRef,
  }), [isOpen, activeIndex, images, openAt, close, goNext, goPrev, goTo]);

  return <LightboxContext.Provider value={value}>{children}</LightboxContext.Provider>;
}

interface ShowcaseLightbox {
  openAt: (index: number, trigger?: HTMLElement | null) => void;
  // False when no LightboxProvider is mounted (e.g. dashboard preview).
  // Templates use this to render images as non-clickable so the user doesn't
  // see a clickable affordance that does nothing.
  interactive: boolean;
}

export function useShowcaseLightbox(): ShowcaseLightbox {
  const ctx = useContext(LightboxContext);
  if (!ctx) {
    return { openAt: () => undefined, interactive: false };
  }
  return { openAt: ctx.openAt, interactive: true };
}

export function useLightboxState(): LightboxApi | null {
  return useContext(LightboxContext);
}
