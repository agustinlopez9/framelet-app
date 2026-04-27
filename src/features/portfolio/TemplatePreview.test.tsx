import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Portfolio, PortfolioImage } from '@/types';

vi.mock('@/features/public-showcase/TemplateHost', () => ({
  TemplateHost: () => <div data-testid="template-host" />,
}));

// The preview component is exported only as part of TemplatesPage; we re-export
// it for testing by importing the module after the mock is set up.
import { TemplatesPage } from './TemplatesPage';

vi.mock('./queries', () => ({
  useMyPortfolio: () => ({
    data: {
      id: 'p1',
      ownerId: 'u1',
      handle: 'alex',
      title: 'Alex',
      bio: '',
      templateId: 'simple-grid',
      templateConfig: {},
      published: true,
      createdAt: '',
      updatedAt: '',
    } as Portfolio,
  }),
  useImages: () => ({ data: [] as PortfolioImage[] }),
  useUpdatePortfolio: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('TemplatesPage preview', () => {
  it('renders the preview inside a clipped, scaled stage', () => {
    render(<TemplatesPage />);
    const wrapper = screen.getByTestId('template-preview');
    expect(wrapper).toBeInTheDocument();
    // The wrapper scrolls vertically (so tall templates can be inspected) but
    // clips horizontally and isolates layout/paint to keep templates that use
    // vh/vw inside the card.
    expect(wrapper).toHaveClass('overflow-y-auto');
    expect(wrapper).toHaveClass('overflow-x-hidden');
    expect(wrapper.style.contain).toBe('layout paint');
    // The inner stage (transformed) sits inside a spacer that mirrors the
    // scaled height so overflow-auto can compute scroll extents.
    const spacer = wrapper.firstElementChild as HTMLElement;
    expect(spacer).toBeTruthy();
    const stage = spacer.firstElementChild as HTMLElement;
    expect(stage).toBeTruthy();
    expect(stage.style.transform).toMatch(/^scale\(/);
    expect(stage.style.transformOrigin).toBe('top left');
  });
});
