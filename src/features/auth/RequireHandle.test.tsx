import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';

const useSessionMock = vi.fn();

vi.mock('./useSession', () => ({
  useSession: () => useSessionMock(),
}));

import { RequireHandle } from './RequireHandle';

function makeSession(handle: string | undefined): Session {
  return {
    access_token: 'a',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'r',
    user: {
      id: 'u1',
      app_metadata: {},
      user_metadata: handle ? { handle } : {},
      aud: 'authenticated',
      created_at: '',
    },
  } as Session;
}

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<RequireHandle />}>
          <Route path="/dashboard" element={<div>Dashboard child</div>} />
        </Route>
        <Route path="/onboarding/handle" element={<div>Onboarding handle page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireHandle', () => {
  beforeEach(() => useSessionMock.mockReset());

  it('renders children when the handle is present', () => {
    useSessionMock.mockReturnValue({ session: makeSession('alex'), status: 'authenticated' });
    renderAt('/dashboard');
    expect(screen.getByText('Dashboard child')).toBeInTheDocument();
  });

  it('redirects to /onboarding/handle when the handle is missing', () => {
    useSessionMock.mockReturnValue({ session: makeSession(undefined), status: 'authenticated' });
    renderAt('/dashboard');
    expect(screen.getByText('Onboarding handle page')).toBeInTheDocument();
  });

  it('shows a loading state while session is loading', () => {
    useSessionMock.mockReturnValue({ session: null, status: 'loading' });
    renderAt('/dashboard');
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});
