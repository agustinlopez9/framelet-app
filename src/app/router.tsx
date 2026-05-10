import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from './PublicLayout';
import { PrivateLayout } from './PrivateLayout';
import { PortfolioLayout } from './PortfolioLayout';
import {
  LoginPage,
  SignUpPage,
  AuthCallbackPage,
  OnboardingPortfolioPage,
  RedirectIfAuthed,
  RequireAuth,
  RequirePortfolio,
} from '@/features/auth';
import { LandingPage } from '@/features/landing';
import {
  PortfolioListPage,
  DashboardPage,
  ImagesPage,
  TemplatesPage,
  SettingsPage,
} from '@/features/portfolio';
import { AccountSettingsPage } from '@/features/account';
import { PublicPortfolioPage, UserPortfolioRedirect } from '@/features/public-showcase';

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
            element: <PrivateLayout />,
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
