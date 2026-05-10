import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLightboxState } from '../LightboxContext';
import { cn } from '@/lib/utils';
import { LightboxControls } from './LightboxControls';
import { LightboxToolbar } from './LightboxToolbar';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.2;

interface LightboxProps {
  /** Extra content rendered along the top edge (left of the built-in
   * controls). Used by the dashboard to expose Edit/Delete actions. */
  topToolbar?: ReactNode;
}

export function Lightbox({ topToolbar }: LightboxProps = {}) {
  const ctx = useLightboxState();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [slideshowOn, setSlideshowOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(
    null,
  );
  const pinchRef = useRef<{ baseDist: number; baseScale: number } | null>(null);

  const isOpen = ctx?.state.isOpen ?? false;
  const activeIndex = ctx?.state.activeIndex ?? 0;
  const images = ctx?.state.images ?? [];
  const image = images[activeIndex];
  const isZoomed = transform.scale > MIN_SCALE + 0.001;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTransform({ scale: 1, x: 0, y: 0 });
  }, [activeIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(document.fullscreenElement === rootRef.current);
    }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const clampPan = useCallback((scale: number, x: number, y: number) => {
    const stage = stageRef.current;
    if (!stage) return { x, y };
    const rect = stage.getBoundingClientRect();
    const maxX = ((scale - 1) * rect.width) / 2;
    const maxY = ((scale - 1) * rect.height) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, []);

  const zoomBy = useCallback(
    (delta: number, originClient?: { cx: number; cy: number }) => {
      setTransform((prev) => {
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale + delta));
        if (next === prev.scale) return prev;
        const stage = stageRef.current;
        let x = prev.x;
        let y = prev.y;
        if (originClient && stage) {
          const rect = stage.getBoundingClientRect();
          const cx = originClient.cx - (rect.left + rect.width / 2);
          const cy = originClient.cy - (rect.top + rect.height / 2);
          const ratio = next / prev.scale;
          x = cx - (cx - prev.x) * ratio;
          y = cy - (cy - prev.y) * ratio;
        }
        const clamped = clampPan(next, next === MIN_SCALE ? 0 : x, next === MIN_SCALE ? 0 : y);
        return { scale: next, x: clamped.x, y: clamped.y };
      });
    },
    [clampPan],
  );

  function onWheel(e: React.WheelEvent) {
    if (!isOpen) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    zoomBy(delta, { cx: e.clientX, cy: e.clientY });
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!isZoomed) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: transform.x,
      baseY: transform.y,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || !isZoomed) return;
    const nx = drag.baseX + (e.clientX - drag.startX);
    const ny = drag.baseY + (e.clientY - drag.startY);
    setTransform((prev) => {
      const clamped = clampPan(prev.scale, nx, ny);
      return { ...prev, x: clamped.x, y: clamped.y };
    });
  }

  function onPointerUp() {
    dragRef.current = null;
    pinchRef.current = null;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length !== 2) return;
    const [a, b] = [e.touches[0]!, e.touches[1]!];
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const cx = (a.clientX + b.clientX) / 2;
    const cy = (a.clientY + b.clientY) / 2;
    if (!pinchRef.current) {
      pinchRef.current = { baseDist: dist, baseScale: transform.scale };
      return;
    }
    const ratio = dist / pinchRef.current.baseDist;
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchRef.current.baseScale * ratio));
    setTransform((prev) => ({
      ...prev,
      scale: next,
      ...(next === MIN_SCALE ? { x: 0, y: 0 } : {}),
    }));
    void cx;
    void cy;
  }

  async function toggleFullscreen() {
    const root = rootRef.current;
    if (!root) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    } else if (root.requestFullscreen) {
      await root.requestFullscreen().catch(() => {});
    }
  }

  if (!ctx || !isOpen || !image) return null;

  const fullscreenSupported =
    typeof document !== 'undefined' && document.fullscreenEnabled === true;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${activeIndex + 1} of ${images.length}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 text-white"
      onClick={(e) => {
        if (e.target === e.currentTarget) ctx.close();
      }}
    >
      <LightboxToolbar topToolbar={topToolbar} activeIndex={activeIndex} total={images.length} />

      <LightboxControls
        isOpen={isOpen}
        imageCount={images.length}
        activeIndex={activeIndex}
        isZoomed={isZoomed}
        isFullscreen={isFullscreen}
        fullscreenSupported={fullscreenSupported}
        slideshowOn={slideshowOn}
        setSlideshowOn={setSlideshowOn}
        onClose={ctx.close}
        onPrev={ctx.goPrev}
        onNext={ctx.goNext}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        ref={stageRef}
        className={cn(
          'relative flex h-full w-full select-none items-center justify-center',
          isZoomed ? 'cursor-grab active:cursor-grabbing' : '',
        )}
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchMove={onTouchMove}
        onTouchEnd={onPointerUp}
        onDoubleClick={() => {
          if (isZoomed) setTransform({ scale: 1, x: 0, y: 0 });
          else zoomBy(1);
        }}
      >
        <img
          ref={imgRef}
          src={image.url}
          alt={image.altText || image.title || 'Portfolio image'}
          draggable={false}
          className="max-h-full max-w-full object-contain transition-transform duration-100"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            willChange: 'transform',
          }}
        />
      </div>
    </div>
  );
}
