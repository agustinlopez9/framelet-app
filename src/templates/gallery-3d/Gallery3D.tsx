import { useCallback, useEffect, useState } from 'react';
import type { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { OpenInViewerButton } from '../_shared/OpenInViewerButton';
import { useLightboxState } from '@/features/public-showcase/lightbox/LightboxContext';

const NEIGHBOR_OFFSET_PX = 280;
const NEIGHBOR_DEPTH_PX = 180;
const NEIGHBOR_ROTATE_DEG = 24;

export default function Gallery3D({ portfolio, images }: TemplateProps) {
  const [active, setActive] = useState(0);
  const lightbox = useLightboxState();
  const lightboxAvailable = !!lightbox;
  const lightboxIsOpen = lightbox?.state.isOpen ?? false;

  const goNext = useCallback(() => {
    if (images.length === 0) return;
    setActive((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    if (images.length === 0) return;
    setActive((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Lightbox owns the keyboard while it's open — don't double-advance.
      if (lightboxIsOpen) return;
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, lightboxIsOpen]);

  const openLightbox = useCallback(() => {
    if (!lightbox) return;
    lightbox.openAt(active);
  }, [lightbox, active]);

  if (images.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-semibold">{portfolio.title || portfolio.handle}</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">{portfolio.bio || 'No images yet.'}</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background text-foreground">
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-10 px-6 pt-12 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">{portfolio.title || portfolio.handle}</h1>
        {portfolio.bio ? (
          <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">{portfolio.bio}</p>
        ) : null}
      </header>

      <OpenInViewerButton index={active} />

      <div
        className="relative flex h-full items-center justify-center px-4 pb-20 pt-32"
        style={{ perspective: '1400px' }}
      >
        <div
          className="relative h-[min(440px,100%)] w-[min(440px,65%)]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {images.map((image, idx) => {
            // Distance in slot space, wrapping so the carousel feels continuous.
            let offset = idx - active;
            const half = images.length / 2;
            if (offset > half) offset -= images.length;
            else if (offset < -half) offset += images.length;

            const isActive = offset === 0;
            const visible = Math.abs(offset) <= 2;
            const tx = offset * NEIGHBOR_OFFSET_PX;
            const tz = -Math.abs(offset) * NEIGHBOR_DEPTH_PX;
            const ry = -offset * NEIGHBOR_ROTATE_DEG;
            const opacity = visible ? Math.max(0, 1 - Math.abs(offset) * 0.4) : 0;
            const z = isActive ? 30 : 10 - Math.abs(offset);

            const activeOpensLightbox = isActive && lightboxAvailable;

            return (
              <button
                type="button"
                key={image.id}
                tabIndex={isActive ? 0 : -1}
                aria-label={
                  isActive
                    ? activeOpensLightbox
                      ? `Open ${image.title || 'image'} in viewer`
                      : `${image.title || 'Image'} — current`
                    : `Show ${image.title || 'image'}`
                }
                aria-current={isActive ? 'true' : undefined}
                onClick={() => {
                  if (isActive) {
                    if (activeOpensLightbox) openLightbox();
                    return;
                  }
                  setActive(idx);
                }}
                className={cn(
                  'group/card absolute inset-0 m-auto flex items-center justify-center bg-transparent p-0 outline-none transition-all duration-500 ease-out focus:outline-none focus-visible:outline-none',
                  isActive
                    ? activeOpensLightbox
                      ? 'cursor-zoom-in'
                      : 'cursor-default'
                    : 'cursor-pointer',
                )}
                style={{
                  transform: `translate3d(${tx}px, 0, ${tz}px) rotateY(${ry}deg)`,
                  opacity,
                  zIndex: z,
                  pointerEvents: visible ? 'auto' : 'none',
                  transformStyle: 'preserve-3d',
                }}
              >
                <img
                  src={image.url}
                  alt={image.altText || image.title || 'Portfolio image'}
                  draggable={false}
                  className="max-h-full max-w-full rounded-md shadow-lg ring-1 ring-black/10 transition-shadow group-focus-visible/card:ring-2 group-focus-visible/card:ring-primary group-focus-visible/card:ring-offset-2 group-focus-visible/card:ring-offset-stone-50"
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-4 pb-24 text-sm">
        <button
          type="button"
          aria-label="Previous image"
          onClick={goPrev}
          className="rounded-full bg-card/80 px-4 py-2 text-card-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur transition hover:bg-card"
        >
          ←
        </button>
        <span className="tabular-nums text-muted-foreground">
          {active + 1} / {images.length}
        </span>
        <button
          type="button"
          aria-label="Next image"
          onClick={goNext}
          className="rounded-full bg-card/80 px-4 py-2 text-card-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur transition hover:bg-card"
        >
          →
        </button>
      </div>
    </div>
  );
}
