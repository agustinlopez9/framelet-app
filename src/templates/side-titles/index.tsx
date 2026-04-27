import type { Template, TemplateProps } from '../types';
import { Figure } from '../_shared/Figure';
import { OpenInViewerButton } from '../_shared/OpenInViewerButton';
import { useShowcaseLightbox } from '@/features/public-showcase/lightbox/LightboxContext';

function SideTitles({ portfolio, images }: TemplateProps) {
  const { openAt, interactive } = useShowcaseLightbox();

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-12">
      <OpenInViewerButton />
      <header className="mb-12">
        <h1 className="text-4xl font-semibold tracking-tight">{portfolio.title || portfolio.handle}</h1>
        {portfolio.bio ? (
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">{portfolio.bio}</p>
        ) : null}
      </header>
      {images.length === 0 ? (
        <p className="text-muted-foreground">No images yet.</p>
      ) : (
        <div className="space-y-24">
          {images.map((image, idx) => (
            <article
              key={image.id}
              className="flex flex-col gap-6 md:flex-row md:items-start md:gap-12"
            >
              <Figure
                className="md:flex-[3]"
                ariaLabel={`Open ${image.title || `image ${idx + 1}`}`}
                onClick={interactive ? () => openAt(idx) : undefined}
              >
                <img
                  src={image.url}
                  alt={image.altText || image.title || 'Portfolio image'}
                  loading="lazy"
                  className="w-full"
                />
              </Figure>
              <aside className="md:sticky md:top-12 md:flex-1 md:self-start">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {String(idx + 1).padStart(2, '0')}
                </p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight">
                  {image.title || 'Untitled'}
                </h2>
                {image.description ? (
                  <p className="mt-3 text-muted-foreground">{image.description}</p>
                ) : null}
              </aside>
            </article>
          ))}
        </div>
      )}
    </div>
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
