import { Link, Outlet } from 'react-router-dom';
import { useSession } from '@/features/auth/useSession';
import { Button } from '@/components/ui/button';

export function PublicLayout() {
  const { status } = useSession();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight">
            framelet
          </Link>
          <nav className="flex items-center gap-2">
            {status === 'authenticated' ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
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
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
