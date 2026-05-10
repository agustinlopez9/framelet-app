import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { useSession } from '@/features/auth/hooks/useSession';
import { signOut } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';

export function AppNavbar() {
  const { status } = useSession();
  const navigate = useNavigate();

  async function onLogout() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <header className="border-b">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo className="h-5 w-5 text-primary" />
          <span>Framelet</span>
        </Link>
        <nav className="flex items-center gap-2">
          {status === 'loading' ? null : status === 'authenticated' ? (
            <>
              <Button asChild size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/settings">
                  <Settings className="mr-1 h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="mr-1 h-4 w-4" />
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
  );
}
