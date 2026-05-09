import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Portfolio, PortfolioImage, User } from '@/types';

vi.mock('@/features/public-showcase/TabbedTemplateHost', () => ({
  TabbedTemplateHost: () => <div data-testid="tabbed-template-host" />,
}));

const mockPortfolio: Portfolio = {
  id: 'p1',
  ownerId: 'u1',
  portfolioHandle: 'alex',
  isDefault: true,
  title: 'Alex',
  bio: '',
  templateId: 'simple-grid',
  templateConfig: {},
  galleryThemeId: 'ocean-depths',
  published: true,
  createdAt: '',
  updatedAt: '',
  folderDisplayMode: 'flat',
  fontId: 'default',
  fontScale: 'regular',
  socialLinks: [],
};

const mockUser: User = {
  id: 'u1',
  email: 'alex@example.com',
  username: 'alex',
  storageUsedBytes: 0,
};

vi.mock('./PortfolioContext', () => ({
  usePortfolioContext: () => ({
    portfolio: mockPortfolio,
    plan: 'free' as const,
    user: mockUser,
  }),
}));

vi.mock('./queries', () => ({
  useImages: () => ({ data: [] as PortfolioImage[] }),
  useFolders: () => ({ data: [] }),
  useUpdatePortfolio: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useMedia: () => ({ data: [] as PortfolioImage[] }),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Import after mocks are set up
import { TemplatesPage } from './TemplatesPage';

describe('TemplatesPage preview', () => {
  it('renders the preview inside a clipped, scaled stage', () => {
    render(<TemplatesPage />);
    const wrapper = screen.getByTestId('template-preview');
    expect(wrapper).toBeInTheDocument();
    // The wrapper scrolls vertically but clips horizontally and isolates layout/paint.
    expect(wrapper).toHaveClass('overflow-y-auto');
    expect(wrapper).toHaveClass('overflow-x-hidden');
    expect(wrapper.style.contain).toBe('layout paint');
    // The inner stage (transformed) sits inside a spacer.
    const spacer = wrapper.firstElementChild as HTMLElement;
    expect(spacer).toBeTruthy();
    const stage = spacer.firstElementChild as HTMLElement;
    expect(stage).toBeTruthy();
    expect(stage.style.transform).toMatch(/^scale\(/);
    expect(stage.style.transformOrigin).toBe('top left');
  });
});
