import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from './PublicLayout';
import { DashboardLayout } from './DashboardLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignUpPage } from '@/features/auth/SignUpPage';
import { RedirectIfAuthed, RequireAuth } from '@/features/auth/RequireAuth';
import { LandingPage } from '@/features/landing/LandingPage';
import { DashboardPage } from '@/features/portfolio/DashboardPage';
import { UploadPage } from '@/features/portfolio/UploadPage';
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
  {
    element: <RequireAuth />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/dashboard/upload', element: <UploadPage /> },
          { path: '/dashboard/templates', element: <TemplatesPage /> },
          { path: '/dashboard/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
