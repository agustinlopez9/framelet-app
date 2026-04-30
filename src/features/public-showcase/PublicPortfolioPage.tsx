import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPortfolioByHandle, type PublicPortfolioResult } from '@/lib/api/portfolios';
import { useSession } from '@/features/auth/useSession';
import { TabbedTemplateHost } from './TabbedTemplateHost';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeScope } from '@/themes/ThemeScope';

type LoadState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'unpublished-owner'; data: PublicPortfolioResult }
  | { status: 'ok'; data: PublicPortfolioResult };

export function PublicPortfolioPage() {
  const { handle } = useParams<{ handle: string }>();
  const { session, status: sessionStatus } = useSession();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (!handle) return;
    if (sessionStatus === 'loading') return;
    let cancelled = false;
    getPortfolioByHandle(handle).then((result) => {
      if (cancelled) return;
      if (!result) {
        setState({ status: 'not-found' });
        return;
      }
      const isOwner = session?.user?.id === result.portfolio.ownerId;
      if (!result.portfolio.published) {
        if (isOwner) setState({ status: 'unpublished-owner', data: result });
        else setState({ status: 'not-found' });
        return;
      }
      setState({ status: 'ok', data: result });
    });
    return () => {
      cancelled = true;
    };
  }, [handle, session?.user?.id, sessionStatus]);

  if (state.status === 'loading') {
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

  if (state.status === 'not-found') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-semibold">Portfolio not found</h1>
        <p className="mt-3 text-muted-foreground">No portfolio exists at this URL.</p>
      </div>
    );
  }

  return (
    <>
      {state.status === 'unpublished-owner' ? (
        <div className="bg-yellow-100 px-4 py-2 text-center text-sm text-yellow-900">
          Unpublished — only you can see this. Toggle Publish in your dashboard to share it.
        </div>
      ) : null}
      <ThemeScope
        themeId={state.data.portfolio.galleryThemeId}
        fontId={state.data.portfolio.fontId}
        className="min-h-screen bg-background text-foreground"
      >
        <TabbedTemplateHost
          portfolio={state.data.portfolio}
          images={state.data.images}
          folders={state.data.folders}
        />
      </ThemeScope>
    </>
  );
}
