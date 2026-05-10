import { NavLink, Navigate, Outlet, useParams } from 'react-router-dom';
import { ArrowLeft, Home, Images, LayoutGrid, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PortfolioContext } from '@/context/PortfolioContext';
import { usePortfolio, useMyUser, useUserPlan } from '@/queries';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export function PortfolioLayout() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(portfolioId);
  const { data: user, isLoading: userLoading } = useMyUser();
  const { data: plan = 'free' } = useUserPlan(user?.id);

  if (portfolioLoading || userLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!portfolio || !user) {
    return <Navigate to="/dashboard" replace />;
  }

  const base = `/dashboard/${portfolioId}`;
  const navItems = [
    { to: base, label: 'Overview', icon: Home, end: true },
    { to: `${base}/images`, label: 'Media', icon: Images, end: false },
    { to: `${base}/templates`, label: 'Templates', icon: LayoutGrid, end: false },
    { to: `${base}/settings`, label: 'Settings', icon: Settings, end: false },
  ];

  return (
    <PortfolioContext.Provider value={{ portfolio, user, plan }}>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
        <aside className="space-y-1">
          <Link
            to="/dashboard"
            className="mb-3 flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All portfolios
          </Link>
          <p className="truncate px-3 pb-1 text-sm font-medium">{portfolio.title || 'Untitled'}</p>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </aside>
        <div>
          <Outlet />
        </div>
      </div>
    </PortfolioContext.Provider>
  );
}
