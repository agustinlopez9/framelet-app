import { Link, Outlet, useMatch } from 'react-router-dom';
import { useSession } from '@/features/auth/useSession';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';

export function PublicLayout() {
  const { status } = useSession();
  // Hide the marketing/auth navbar entirely on public portfolio routes
  // (`/u/:handle`). The portfolio page renders its own chrome (an owner-only
  // "Back to dashboard" pill) so visitors see the portfolio uninterrupted.
  const isPortfolioRoute = !!useMatch('/u/:handle');

  return (
    <div className="flex min-h-screen flex-col">
      {isPortfolioRoute ? null : (
        <header className="border-b">
          <div className="container flex h-14 items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 font-semibold tracking-tight"
            >
              <Logo className="h-5 w-5 text-primary" />
              <span>Framelet</span>
            </Link>
            <nav className="flex items-center gap-2">
              {status === 'authenticated' ? (
                <Button asChild size="sm">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="bg-background text-foreground hover:bg-primary hover:text-white"
                  >
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/signup">Sign up</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        </header>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
