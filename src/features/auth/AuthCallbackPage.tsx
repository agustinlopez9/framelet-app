import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { deriveUsernameFromEmail, setMyUsername } from '@/lib/api/auth';

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

        const meta = data.user?.user_metadata as { username?: string } | undefined;
        const next = params.get('next') ?? '/dashboard';

        // For OAuth users without a username in metadata, derive from email and persist
        if (!meta?.username && data.user?.email) {
          const derived = deriveUsernameFromEmail(data.user.email);
          try {
            await setMyUsername(derived);
          } catch {
            // Non-fatal: DB trigger already created the users row with a derived username
          }
        }

        navigate(next, { replace: true });
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
