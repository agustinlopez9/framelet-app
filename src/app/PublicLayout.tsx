import { Link, Outlet, useMatch, useNavigate } from 'react-router-dom';
import { useSession } from '@/features/auth/useSession';
import { signOut } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';

export function PublicLayout() {
  const { status } = useSession();
  const navigate = useNavigate();
  // Hide the navbar on public portfolio pages so visitors see the portfolio uninterrupted.
  const isPortfolioRoute =
    !!useMatch('/:username/:portfolioHandle');

  async function onLogout() {
    await signOut();
    navigate('/', { replace: true });
  }

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
                <>
                  <Button asChild size="sm">
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onLogout}>
                    Log out
                  </Button>
                </>
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
