import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

/**
 * Gate that runs after RequireAuth. If the authenticated user has no handle
 * stored in their auth metadata (e.g., they signed up via Google OAuth and
 * haven't picked one yet), send them to /onboarding/handle. Otherwise pass
 * through to the dashboard.
 */
export function RequireHandle() {
  const { session, status } = useSession();
  const location = useLocation();

  if (status === 'loading') {
    return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  }

  const handle = (session?.user?.user_metadata as { handle?: string } | undefined)?.handle;
  if (!handle) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/onboarding/handle?next=${next}`} replace />;
  }

  return <Outlet />;
}
