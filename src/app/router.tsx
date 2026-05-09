import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from './PublicLayout';
import { DashboardLayout } from './DashboardLayout';
import { PortfolioLayout } from './PortfolioLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignUpPage } from '@/features/auth/SignUpPage';
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage';
import { OnboardingPortfolioPage } from '@/features/auth/OnboardingPortfolioPage';
import { RedirectIfAuthed, RequireAuth } from '@/features/auth/RequireAuth';
import { RequirePortfolio } from '@/features/auth/RequirePortfolio';
import { LandingPage } from '@/features/landing/LandingPage';
import { PortfolioListPage } from '@/features/portfolio/PortfolioListPage';
import { DashboardPage } from '@/features/portfolio/DashboardPage';
import { ImagesPage } from '@/features/portfolio/ImagesPage';
import { TemplatesPage } from '@/features/portfolio/TemplatesPage';
import { SettingsPage } from '@/features/portfolio/SettingsPage';
import { AccountSettingsPage } from '@/features/account/AccountSettingsPage';
import { PublicPortfolioPage } from '@/features/public-showcase/PublicPortfolioPage';
import { UserPortfolioRedirect } from '@/features/public-showcase/UserPortfolioRedirect';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      {
        element: <RedirectIfAuthed />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/signup', element: <SignUpPage /> },
        ],
      },
      // Public portfolio routes — keep AFTER static paths
      { path: '/:username/:portfolioHandle', element: <PublicPortfolioPage /> },
      { path: '/:username', element: <UserPortfolioRedirect /> },
    ],
  },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/onboarding/portfolio', element: <OnboardingPortfolioPage /> },
      {
        element: <RequirePortfolio />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: '/dashboard', element: <PortfolioListPage /> },
              { path: '/dashboard/new', element: <OnboardingPortfolioPage /> },
              { path: '/settings', element: <AccountSettingsPage /> },
              {
                path: '/dashboard/:portfolioId',
                element: <PortfolioLayout />,
                children: [
                  { index: true, element: <DashboardPage /> },
                  { path: 'images', element: <ImagesPage /> },
                  {
                    path: 'upload',
                    element: <Navigate to="images" replace />,
                  },
                  { path: 'templates', element: <TemplatesPage /> },
                  { path: 'settings', element: <SettingsPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
