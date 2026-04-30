import { useEffect, useRef, useState } from 'react';
import type { Template, TemplateProps } from '../types';
import { Figure } from '../_shared/Figure';
import { OpenInViewerButton } from '../_shared/OpenInViewerButton';
import { useShowcaseLightbox } from '@/features/public-showcase/lightbox/LightboxContext';

const FOCUSED_SCALE = 1.08;
const UNFOCUSED_SCALE = 1.0;
const FOCUSED_OPACITY = 1;
const UNFOCUSED_OPACITY = 0.55;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

interface FocusItemProps {
  url: string;
  alt: string;
  reducedMotion: boolean;
  onOpen?: () => void;
  ariaLabel: string;
}

function getScrollParent(node: HTMLElement | null): HTMLElement | Window {
  let parent = node?.parentElement ?? null;
  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
}

function FocusItem({ url, alt, reducedMotion, onOpen, ariaLabel }: FocusItemProps) {
  const itemRef = useRef<HTMLDivElement | null>(null);
  const [centerness, setCenterness] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const node = itemRef.current;
    if (!node) return;
    const scrollParent = getScrollParent(node);

    let raf = 0;
    const update = () => {
      const rect = node.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      let viewportTop = 0;
      let viewportHeight = window.innerHeight;
      if (scrollParent !== window) {
        const sp = scrollParent as HTMLElement;
        const spRect = sp.getBoundingClientRect();
        viewportTop = spRect.top;
        viewportHeight = sp.clientHeight;
      }
      const viewportCenter = viewportTop + viewportHeight / 2;
      const distance = Math.abs(itemCenter - viewportCenter);
      // Centerness: 1 when image center == viewport center, 0 when half a viewport away.
      const c = Math.max(0, 1 - distance / Math.max(1, viewportHeight / 2));
      setCenterness(c);
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    scrollParent.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      cancelAnimationFrame(raf);
      scrollParent.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [reducedMotion]);

  const scale = reducedMotion
    ? UNFOCUSED_SCALE
    : UNFOCUSED_SCALE + (FOCUSED_SCALE - UNFOCUSED_SCALE) * centerness;
  const opacity = reducedMotion
    ? FOCUSED_OPACITY
    : UNFOCUSED_OPACITY + (FOCUSED_OPACITY - UNFOCUSED_OPACITY) * centerness;

  return (
    <div
      ref={itemRef}
      style={{
        transform: `scale(${scale.toFixed(3)})`,
        opacity: opacity.toFixed(3),
        transition: reducedMotion ? 'none' : 'transform 200ms ease-out, opacity 200ms ease-out',
      }}
    >
      <Figure ariaLabel={ariaLabel} onClick={onOpen}>
        <img src={url} alt={alt} loading="lazy" className="w-full" />
      </Figure>
    </div>
  );
}

function VerticalFocus({ portfolio, images, hideHeader }: TemplateProps) {
  const { openAt, interactive } = useShowcaseLightbox();
  const reducedMotion = usePrefersReducedMotion();

  if (images.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        {hideHeader ? null : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">{portfolio.title || portfolio.handle}</h1>
            {portfolio.bio ? (
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{portfolio.bio}</p>
            ) : null}
          </>
        )}
        <p className="mt-10 text-muted-foreground">No images yet.</p>
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto w-full max-w-[min(85vw,1100px)] px-2 pb-[40vh] pt-12 sm:px-4"
      style={{ fontSize: 'calc(1rem * var(--portfolio-font-scale, 1))' }}
    >
      <OpenInViewerButton />
      {hideHeader ? null : (
        <header className="mb-24 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{portfolio.title || portfolio.handle}</h1>
          {portfolio.bio ? (
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{portfolio.bio}</p>
          ) : null}
        </header>
      )}
      <div className="space-y-[20vh]">
        {images.map((image, idx) => (
          <FocusItem
            key={image.id}
            url={image.url}
            alt={image.altText || image.title || 'Portfolio image'}
            reducedMotion={reducedMotion}
            onOpen={interactive ? () => openAt(idx) : undefined}
            ariaLabel={`Open ${image.title || `image ${idx + 1}`}`}
          />
        ))}
      </div>
    </div>
  );
}

export const verticalFocusTemplate: Template = {
  id: 'vertical-focus',
  name: 'Vertical Focus',
  description: 'Single column. The image at the viewport center grows; others dim.',
  thumbnail: '/templates/vertical-focus.svg',
  defaultConfig: {},
  loadComponent: async () => VerticalFocus,
};

export default VerticalFocus;
