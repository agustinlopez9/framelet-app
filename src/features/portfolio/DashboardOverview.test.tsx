import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Portfolio } from '@/features/portfolio/types';
import type { User } from '@/types';

const toastMock = vi.fn();

function makePortfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    id: 'p1',
    ownerId: 'u1',
    portfolioHandle: 'my-portfolio',
    isDefault: true,
    title: 'Some Title',
    bio: 'Some bio',
    templateId: 'simple-grid',
    templateConfig: {},
    galleryThemeId: 'ocean-depths',
    published: false,
    createdAt: '',
    updatedAt: '',
    folderDisplayMode: 'flat',
    fontId: 'default',
    fontScale: 'regular',
    socialLinks: [],
    ...overrides,
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    email: 'alex@example.com',
    username: 'alex',
    storageUsedBytes: 0,
    ...overrides,
  };
}

const contextMock = vi.fn();

vi.mock('./PortfolioContext', () => ({
  usePortfolioContext: () => contextMock(),
}));

vi.mock('./queries', () => ({
  useMedia: () => ({ data: [] }),
  useUpdatePortfolio: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/templates', () => ({
  get: () => ({ id: 'simple-grid', name: 'Simple Grid' }),
}));

vi.mock('@/hooks/use-toast', () => ({ toast: (...args: unknown[]) => toastMock(...args) }));

import { DashboardOverview } from './components/DashboardOverview';

function renderOverview() {
  return render(
    <MemoryRouter>
      <DashboardOverview />
    </MemoryRouter>,
  );
}

describe('DashboardOverview', () => {
  it('renders the overview subtitle', () => {
    contextMock.mockReturnValue({ portfolio: makePortfolio(), user: makeUser(), plan: 'free' });
    renderOverview();

    expect(
      screen.getByText(/Manage your portfolio, share your link, and toggle publish\./),
    ).toBeInTheDocument();
  });

  it('shows the full framelet.app URL with username/portfolioHandle', () => {
    contextMock.mockReturnValue({
      portfolio: makePortfolio({ portfolioHandle: 'my-portfolio', published: true }),
      user: makeUser({ username: 'alex' }),
      plan: 'free',
    });
    renderOverview();

    expect(screen.getByText('framelet.app/alex/my-portfolio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('copies the absolute portfolio URL when Copy is clicked', async () => {
    contextMock.mockReturnValue({
      portfolio: makePortfolio({ portfolioHandle: 'my-portfolio', published: true }),
      user: makeUser({ username: 'alex' }),
      plan: 'free',
    });

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    renderOverview();
    await userEvent.click(screen.getByRole('button', { name: /copy/i }));

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/alex/my-portfolio`);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Link copied' }));
  });

  it('does not render the portfolio title or bio', () => {
    contextMock.mockReturnValue({
      portfolio: makePortfolio({ title: 'My Title', bio: 'My bio' }),
      user: makeUser(),
      plan: 'free',
    });
    renderOverview();

    expect(screen.queryByText('My Title')).not.toBeInTheDocument();
    expect(screen.queryByText('My bio')).not.toBeInTheDocument();
  });
});
