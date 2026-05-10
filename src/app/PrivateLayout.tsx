import { Outlet } from 'react-router-dom';
import { AppNavbar } from './AppNavbar';

export function PrivateLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppNavbar />
      <main className="container flex-1 pb-32 pt-8">
        <Outlet />
      </main>
    </div>
  );
}
