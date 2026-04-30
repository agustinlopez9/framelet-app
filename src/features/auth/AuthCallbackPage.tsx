import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/**
 * OAuth callback landing page. Exchanges the code for a session, then routes
 * the user to either /onboarding/handle (if their handle is missing) or the
 * `next` query param (default /dashboard).
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(
          window.location.href,
        );
        if (cancelled) return;
        if (exchangeErr) {
          setError(exchangeErr.message);
          return;
        }
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        const handle = (data.user?.user_metadata as { handle?: string } | undefined)?.handle;
        const next = params.get('next') ?? '/dashboard';
        if (!handle) {
          navigate(`/onboarding/handle?next=${encodeURIComponent(next)}`, { replace: true });
        } else {
          navigate(next, { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Sign-in failed.');
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [navigate, params]);

  if (error) {
    return (
      <div className="mx-auto max-w-md py-16">
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="mt-4 block w-full text-center text-sm underline"
        >
          Back to log in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center text-sm text-muted-foreground">
      Finishing sign-in…
    </div>
  );
}
