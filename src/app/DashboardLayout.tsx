import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSession } from '@/features/auth/useSession';
import { signOut } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { LogOut, Home, Images, LayoutGrid, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: Home, end: true },
  { to: '/dashboard/images', label: 'Images', icon: Images, end: false },
  { to: '/dashboard/templates', label: 'Templates', icon: LayoutGrid, end: false },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings, end: false },
];

export function DashboardLayout() {
  const { session } = useSession();
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
            <span className="hidden text-sm text-muted-foreground md:inline">
              {session?.user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      </header>
      <div className="container flex-1 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
          <aside className="space-y-1">
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
          <Outlet />
        </div>
      </div>
    </div>
  );
}
