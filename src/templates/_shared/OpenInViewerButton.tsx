import { Maximize } from 'lucide-react';
import { useShowcaseLightbox } from '@/features/public-showcase/lightbox/LightboxContext';

interface OpenInViewerButtonProps {
  // Index of the image to open at. Defaults to 0 (first image). Templates with
  // a "current" concept (e.g. gallery-3d) pass that index instead.
  index?: number;
}

export function OpenInViewerButton({ index = 0 }: OpenInViewerButtonProps) {
  const { openAt, interactive } = useShowcaseLightbox();
  if (!interactive) return null;
  return (
    <button
      type="button"
      aria-label="Open viewer"
      onClick={() => openAt(index)}
      // top-[4.5rem] = navbar (h-14 = 3.5rem) + 1rem gap. Pinned to the viewport
      // so it stays visible while scrolling templates that grow tall.
      className="fixed right-4 top-[4.5rem] z-30 rounded-full bg-card/80 p-2 text-card-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur transition hover:bg-card"
    >
      <Maximize className="h-5 w-5" />
    </button>
  );
}
