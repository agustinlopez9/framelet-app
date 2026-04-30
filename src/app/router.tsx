import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from './PublicLayout';
import { DashboardLayout } from './DashboardLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignUpPage } from '@/features/auth/SignUpPage';
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage';
import { OnboardingHandlePage } from '@/features/auth/OnboardingHandlePage';
import { RedirectIfAuthed, RequireAuth } from '@/features/auth/RequireAuth';
import { RequireHandle } from '@/features/auth/RequireHandle';
import { LandingPage } from '@/features/landing/LandingPage';
import { DashboardPage } from '@/features/portfolio/DashboardPage';
import { ImagesPage } from '@/features/portfolio/ImagesPage';
import { TemplatesPage } from '@/features/portfolio/TemplatesPage';
import { SettingsPage } from '@/features/portfolio/SettingsPage';
import { PublicPortfolioPage } from '@/features/public-showcase/PublicPortfolioPage';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/u/:handle', element: <PublicPortfolioPage /> },
      {
        element: <RedirectIfAuthed />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/signup', element: <SignUpPage /> },
        ],
      },
    ],
  },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/onboarding/handle', element: <OnboardingHandlePage /> },
      {
        element: <RequireHandle />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/dashboard/images', element: <ImagesPage /> },
              {
                path: '/dashboard/upload',
                element: <Navigate to="/dashboard/images" replace />,
              },
              { path: '/dashboard/templates', element: <TemplatesPage /> },
              { path: '/dashboard/settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
