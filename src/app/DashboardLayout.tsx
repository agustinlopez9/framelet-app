import { Link, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { signOut } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';

export function DashboardLayout() {
  const navigate = useNavigate();

  async function onLogout() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <Logo className="h-5 w-5 text-primary" />
            <span>Framelet</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild size="sm">
              <Link to="/dashboard">
                Dashboard
              </Link>
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
          </div>
        </div>
      </header>
      <div className="container flex-1 pb-32 pt-8">
        <Outlet />
      </div>
    </div>
  );
}
