import { useCallback, useEffect, useRef, useState } from 'react';
import type { TemplateProps } from '../types';
import { cn } from '@/lib/utils';
import { OpenInViewerButton } from '../_shared/OpenInViewerButton';
import { useLightboxState } from '@/features/public-showcase/lightbox/LightboxContext';

const NEIGHBOR_OFFSET_PX = 280;
const NEIGHBOR_DEPTH_PX = 180;
const NEIGHBOR_ROTATE_DEG = 24;
// Number of pixels the user must drag horizontally to advance the carousel
// by one image. Multi-image swipes use Math.round(dx / SNAP_PX_PER_STEP).
const SNAP_PX_PER_STEP = 100;
// Below this distance, the gesture is treated as a click (no advance).
const DRAG_DEAD_ZONE_PX = SNAP_PX_PER_STEP / 2;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export default function Gallery3D({ portfolio, images, hideHeader }: TemplateProps) {
  const [active, setActive] = useState(0);
  const lightbox = useLightboxState();
  const lightboxAvailable = !!lightbox;
  const lightboxIsOpen = lightbox?.state.isOpen ?? false;
  const dragStateRef = useRef<{ pointerId: number; startX: number; moved: boolean } | null>(null);

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

  const onStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only react to primary-button presses; some test/event constructors leave
    // `button` undefined, which is treated as primary.
    if (e.button && e.button !== 0) return;
    dragStateRef.current = { pointerId: e.pointerId, startX: e.clientX, moved: false };
    if (typeof e.currentTarget.setPointerCapture === 'function') {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const onStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    if (Math.abs(e.clientX - state.startX) > 5) state.moved = true;
  };

  const onStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const dx = e.clientX - state.startX;
    dragStateRef.current = null;
    if (
      typeof e.currentTarget.hasPointerCapture === 'function' &&
      e.currentTarget.hasPointerCapture(e.pointerId)
    ) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (Math.abs(dx) < DRAG_DEAD_ZONE_PX) return;
    // Drag left (negative dx) advances forward; drag right rewinds.
    const steps = Math.round(dx / SNAP_PX_PER_STEP);
    if (steps !== 0 && images.length > 0) {
      setActive((i) => mod(i - steps, images.length));
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        {hideHeader ? null : (
          <>
            <h1 className="text-3xl font-semibold">{portfolio.title || portfolio.handle}</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              {portfolio.bio || 'No images yet.'}
            </p>
          </>
        )}
        {hideHeader ? <p className="text-muted-foreground">No images yet.</p> : null}
      </div>
    );
  }

  return (
    <div
      className="relative h-screen w-full overflow-hidden text-foreground"
      style={{ fontSize: 'calc(1rem * var(--portfolio-font-scale, 1))' }}
    >
      {hideHeader ? null : (
        <header className="pointer-events-none absolute left-0 right-0 top-0 z-10 px-6 pt-12 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">
            {portfolio.title || portfolio.handle}
          </h1>
          {portfolio.bio ? (
            <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">{portfolio.bio}</p>
          ) : null}
        </header>
      )}

      <OpenInViewerButton index={active} />

      <div
        className="relative flex h-full touch-pan-y select-none items-center justify-center px-4 pb-20 pt-32"
        style={{ perspective: '1400px' }}
        onPointerDown={onStagePointerDown}
        onPointerMove={onStagePointerMove}
        onPointerUp={onStagePointerUp}
        onPointerCancel={onStagePointerUp}
        data-testid="gallery-3d-stage"
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
                  // Don't treat a drag-release as a click on the active card.
                  if (isActive && dragStateRef.current === null) {
                    if (activeOpensLightbox) openLightbox();
                    return;
                  }
                  if (!isActive) setActive(idx);
                }}
                className={cn(
                  'group/card absolute inset-0 m-auto flex items-center justify-center bg-transparent p-0 outline-none transition-all duration-500 ease-out focus:outline-none focus-visible:outline-none',
                  isActive
                    ? activeOpensLightbox
                      ? 'cursor-grab active:cursor-grabbing'
                      : 'cursor-grab active:cursor-grabbing'
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
                  className={cn(
                    'rounded-md shadow-lg ring-1 ring-black/10 transition-shadow group-focus-visible/card:ring-2 group-focus-visible/card:ring-primary group-focus-visible/card:ring-offset-2 group-focus-visible/card:ring-offset-stone-50',
                    isActive ? '' : 'max-h-full max-w-full',
                  )}
                  style={isActive ? { maxWidth: 'min(85vw, 720px)', maxHeight: '80vh' } : undefined}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
