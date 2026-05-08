import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Portfolio } from '@/types';

const useMyPortfolioMock = vi.fn();
const useImagesMock = vi.fn();
const toastMock = vi.fn();

vi.mock('./queries', () => ({
  useMyPortfolio: () => useMyPortfolioMock(),
  useImages: () => useImagesMock(),
  useUpdatePortfolio: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/templates', () => ({
  get: () => ({ id: 'simple-grid', name: 'Simple Grid' }),
}));

vi.mock('@/hooks/use-toast', () => ({ toast: (...args: unknown[]) => toastMock(...args) }));

import { DashboardOverview } from './DashboardOverview';

function makePortfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    id: 'p1',
    ownerId: 'u1',
    handle: 'alex',
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

function renderOverview() {
  return render(
    <MemoryRouter>
      <DashboardOverview />
    </MemoryRouter>,
  );
}

describe('DashboardOverview', () => {
  it('renders a name-free greeting and a static subtitle that does not reference Settings', () => {
    useMyPortfolioMock.mockReturnValue({ data: makePortfolio(), isLoading: false });
    useImagesMock.mockReturnValue({ data: [] });
    renderOverview();

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.queryByText(/Welcome back —/)).not.toBeInTheDocument();
    expect(screen.queryByText(/in Settings/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Manage your portfolio, share your link, and toggle publish\./),
    ).toBeInTheDocument();
  });

  it('shows the full framelet.app URL for the handle and a Copy button', async () => {
    useMyPortfolioMock.mockReturnValue({
      data: makePortfolio({ handle: 'alex', published: true }),
      isLoading: false,
    });
    useImagesMock.mockReturnValue({ data: [] });
    renderOverview();

    expect(screen.getByText('framelet.app/u/alex')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('copies the absolute portfolio URL when Copy is clicked', async () => {
    useMyPortfolioMock.mockReturnValue({
      data: makePortfolio({ handle: 'alex', published: true }),
      isLoading: false,
    });
    useImagesMock.mockReturnValue({ data: [] });

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    renderOverview();
    await userEvent.click(screen.getByRole('button', { name: /copy/i }));

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/u/alex`);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Link copied' }));
  });

  it('does not render the portfolio title or bio in the heading', () => {
    useMyPortfolioMock.mockReturnValue({
      data: makePortfolio({ title: 'My Title', bio: 'My bio' }),
      isLoading: false,
    });
    useImagesMock.mockReturnValue({ data: [] });
    renderOverview();

    expect(screen.queryByText('My Title')).not.toBeInTheDocument();
    expect(screen.queryByText('My bio')).not.toBeInTheDocument();
  });
});
