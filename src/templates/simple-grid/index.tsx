import type { Template, TemplateProps } from '../types';
import type { PortfolioImage } from '@/types';
import { Figure } from '../_shared/Figure';
import { OpenInViewerButton } from '../_shared/OpenInViewerButton';
import { useShowcaseLightbox } from '@/features/public-showcase/lightbox/LightboxContext';
import { useFadeInOnScroll } from '@/lib/useFadeInOnScroll';
import { cn } from '@/lib/utils';

function SimpleGrid({ portfolio, images, hideHeader }: TemplateProps) {
  const { openAt, interactive } = useShowcaseLightbox();

  return (
    <div
      className="relative mx-auto max-w-6xl px-4 py-12"
      style={{ fontSize: 'calc(1rem * var(--portfolio-font-scale, 1))' }}
    >
      <OpenInViewerButton />
      {hideHeader ? null : (
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{portfolio.title || portfolio.handle}</h1>
          {portfolio.bio ? (
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{portfolio.bio}</p>
          ) : null}
        </header>
      )}
      {images.length === 0 ? (
        <p className="text-center text-muted-foreground">No images yet.</p>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
          {images.map((image, idx) => (
            <FadeInTile
              key={image.id}
              image={image}
              idx={idx}
              onOpen={interactive ? () => openAt(idx) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FadeInTileProps {
  image: PortfolioImage;
  idx: number;
  onOpen?: () => void;
}

function FadeInTile({ image, idx, onOpen }: FadeInTileProps) {
  const { ref, shown } = useFadeInOnScroll<HTMLDivElement>({
    delayMs: Math.min(idx * 50, 400),
  });
  return (
    <div ref={ref} className={cn('fade-up-init', shown && 'fade-up-shown')}>
      <Figure
        ariaLabel={`Open ${image.title || `image ${idx + 1}`}`}
        onClick={onOpen}
      >
        <img
          src={image.url}
          alt={image.altText || image.title || 'Portfolio image'}
          loading="lazy"
          className="w-full"
        />
        {image.title ? (
          <figcaption className="border-t bg-card/60 p-2 text-sm text-muted-foreground">
            {image.title}
          </figcaption>
        ) : null}
      </Figure>
    </div>
  );
}

export const simpleGridTemplate: Template = {
  id: 'simple-grid',
  name: 'Simple Grid',
  description: 'A responsive masonry grid. Clean, fast, gets out of the way.',
  thumbnail: '/templates/simple-grid.svg',
  defaultConfig: {},
  loadComponent: async () => SimpleGrid,
};

export default SimpleGrid;
