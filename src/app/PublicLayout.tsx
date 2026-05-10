import { Outlet, useMatch } from 'react-router-dom';
import { AppNavbar } from './AppNavbar';

export function PublicLayout() {
  // Hide the navbar on public portfolio pages so visitors see the portfolio uninterrupted.
  const isPortfolioRoute = !!useMatch('/:username/:portfolioHandle');

  return (
    <div className="flex min-h-screen flex-col">
      {isPortfolioRoute ? null : <AppNavbar />}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
