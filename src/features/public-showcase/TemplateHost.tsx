import { Suspense, useEffect, useMemo, useState } from 'react';
import { ensureRegistered, get, DEFAULT_TEMPLATE_ID } from '@/templates';
import type { Template } from '@/templates/types';
import type { Portfolio, PortfolioImage } from '@/features/portfolio/types';
import { Skeleton } from '@/components/ui/skeleton';
import { LightboxProvider } from './lightbox/LightboxContext';
import { Lightbox } from './lightbox/Lightbox';

ensureRegistered();

interface TemplateHostProps {
  portfolio: Portfolio;
  images: PortfolioImage[];
  templateIdOverride?: string;
  // True when rendered inside the dashboard preview. Suppresses the lightbox
  // entirely — images don't open and the (transform-broken) Fullscreen API is
  // unreachable. Templates render images as non-interactive figures.
  inPreview?: boolean;
  hideHeader?: boolean;
}

function TemplateLoadingFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Skeleton className="mx-auto h-8 w-48" />
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full" />
        ))}
      </div>
    </div>
  );
}

export function TemplateHost({
  portfolio,
  images,
  templateIdOverride,
  inPreview = false,
  hideHeader = false,
}: TemplateHostProps) {
  const requestedId = templateIdOverride ?? portfolio.templateId;
  const resolved: Template = useMemo(() => {
    const t = get(requestedId);
    if (!t) {
      console.warn(
        `Template "${requestedId}" not in registry; falling back to "${DEFAULT_TEMPLATE_ID}".`,
      );
      return get(DEFAULT_TEMPLATE_ID)!;
    }
    return t;
  }, [requestedId]);

  const [Component, setComponent] = useState<React.ComponentType<{
    portfolio: Portfolio;
    images: PortfolioImage[];
    config: Record<string, unknown>;
    inPreview?: boolean;
    hideHeader?: boolean;
  }> | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setComponent(null);
    resolved
      .loadComponent()
      .then((C) => {
        if (!cancelled) setComponent(() => C as typeof Component extends infer X ? X : never);
      })
      .catch((err) => {
        console.error(`Failed to load template "${resolved.id}":`, err);
      });
    return () => {
      cancelled = true;
    };
  }, [resolved]);

  if (!Component) return <TemplateLoadingFallback />;

  const rendered = (
    <Suspense fallback={<TemplateLoadingFallback />}>
      <Component
        portfolio={portfolio}
        images={images}
        config={portfolio.templateConfig}
        inPreview={inPreview}
        hideHeader={hideHeader}
      />
    </Suspense>
  );

  if (resolved.interactive === false || inPreview) return rendered;

  return (
    <LightboxProvider images={images}>
      {rendered}
      <Lightbox />
    </LightboxProvider>
  );
}
