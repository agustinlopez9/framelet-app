import type { Template, TemplateProps } from '../types';
import type { PortfolioImage } from '@/features/portfolio/types';
import { Figure } from '../_shared/Figure';
import { OpenInViewerButton } from '../_shared/OpenInViewerButton';
import { useShowcaseLightbox } from '@/features/public-showcase/lightbox/LightboxContext';
import { useFadeInOnScroll } from '@/hooks/useFadeInOnScroll';
import { cn } from '@/lib/utils';

function SideTitles({ portfolio, images, hideHeader }: TemplateProps) {
  const { openAt, interactive } = useShowcaseLightbox();

  return (
    <div
      className="relative mx-auto max-w-7xl px-4 py-12"
      style={{ fontSize: 'calc(1rem * var(--portfolio-font-scale, 1))' }}
    >
      <OpenInViewerButton />
      {hideHeader ? null : (
        <header className="mb-12">
          <h1 className="text-4xl font-semibold tracking-tight">
            {portfolio.title || portfolio.handle}
          </h1>
          {portfolio.bio ? (
            <p className="mt-4 max-w-3xl text-lg text-muted-foreground">{portfolio.bio}</p>
          ) : null}
        </header>
      )}
      {images.length === 0 ? (
        <p className="text-muted-foreground">No images yet.</p>
      ) : (
        <div className="space-y-24">
          {images.map((image, idx) => (
            <SideTitleRow
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

interface RowProps {
  image: PortfolioImage;
  idx: number;
  onOpen?: () => void;
}

function SideTitleRow({ image, idx, onOpen }: RowProps) {
  const { ref, shown } = useFadeInOnScroll<HTMLElement>();
  return (
    <article
      ref={ref as React.Ref<HTMLElement>}
      className={cn(
        'flex flex-col gap-6 md:flex-row md:items-start md:gap-12',
        'slide-up-init',
        shown && 'slide-up-shown',
      )}
    >
      <Figure
        className="md:flex-[3]"
        ariaLabel={`Open ${image.title || `image ${idx + 1}`}`}
        onClick={onOpen}
      >
        <img
          src={image.url}
          alt={image.altText || image.title || 'Portfolio image'}
          loading="lazy"
          className="w-full"
        />
      </Figure>
      <aside className="md:flex-1 md:self-start">
        <h2 className="text-2xl font-medium tracking-tight">{image.title || 'Untitled'}</h2>
        {image.description ? (
          <p className="mt-3 text-muted-foreground">{image.description}</p>
        ) : null}
      </aside>
    </article>
  );
}

export const sideTitlesTemplate: Template = {
  id: 'side-titles',
  name: 'Side Titles',
  description: 'Editorial layout: full-bleed images with titles and notes in a side rail.',
  thumbnail: '/templates/side-titles.svg',
  defaultConfig: {},
  loadComponent: async () => SideTitles,
};

export default SideTitles;
