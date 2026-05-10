import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize, Pause, Play, X } from 'lucide-react';

const SLIDESHOW_INTERVAL_MS = 3000;

interface LightboxControlsProps {
  isOpen: boolean;
  imageCount: number;
  activeIndex: number;
  isZoomed: boolean;
  isFullscreen: boolean;
  fullscreenSupported: boolean;
  slideshowOn: boolean;
  setSlideshowOn: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleFullscreen: () => void;
}

export function LightboxControls({
  isOpen,
  imageCount,
  activeIndex,
  isZoomed,
  isFullscreen,
  fullscreenSupported,
  slideshowOn,
  setSlideshowOn,
  onClose,
  onPrev,
  onNext,
  onToggleFullscreen,
}: LightboxControlsProps) {
  useEffect(() => {
    if (!isOpen) setSlideshowOn(false);
  }, [isOpen, setSlideshowOn]);

  useEffect(() => {
    if (!isOpen || !slideshowOn || isZoomed || imageCount < 2) return;
    const id = window.setInterval(onNext, SLIDESHOW_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isOpen, slideshowOn, isZoomed, activeIndex, imageCount, onNext]);

  useEffect(() => {
    if (!isOpen) return;
    function onVisibility() {
      if (document.hidden) setSlideshowOn(false);
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isOpen, setSlideshowOn]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setSlideshowOn((on) => !on);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, onNext, onPrev, setSlideshowOn]);

  return (
    <>
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <button
          type="button"
          aria-label={slideshowOn ? 'Pause slideshow' : 'Start slideshow'}
          onClick={() => setSlideshowOn((on) => !on)}
          className="rounded-full bg-white/10 p-2 backdrop-blur transition hover:bg-white/20"
        >
          {slideshowOn ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        {fullscreenSupported ? (
          <button
            type="button"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            onClick={onToggleFullscreen}
            className="rounded-full bg-white/10 p-2 backdrop-blur transition hover:bg-white/20"
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 backdrop-blur transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {imageCount > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={onPrev}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 backdrop-blur transition hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={onNext}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 backdrop-blur transition hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      ) : null}
    </>
  );
}
