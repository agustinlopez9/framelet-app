import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMyPortfolios } from '@/queries';

export function RequirePortfolio() {
  const { data: portfolios, isLoading } = useMyPortfolios();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  }

  if (!portfolios || portfolios.length === 0) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/onboarding/portfolio?next=${next}`} replace />;
  }

  return <Outlet />;
}
