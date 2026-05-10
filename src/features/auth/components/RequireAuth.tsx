import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

export function RequireAuth() {
  const { status } = useSession();
  const location = useLocation();

  if (status === 'loading') {
    return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  }
  if (status === 'unauthenticated') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
}

export function RedirectIfAuthed() {
  const { status } = useSession();
  if (status === 'loading') {
    return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  }
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
