import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ImageFolder, Portfolio, PortfolioImage } from '@/types';

const templateHostMock = vi.fn(({ images }: { images: PortfolioImage[] }) => (
  <div data-testid="template-host" data-image-count={images.length}>
    {images.map((img) => (
      <span key={img.id} data-testid="img">
        {img.id}
      </span>
    ))}
  </div>
));

vi.mock('./TemplateHost', () => ({
  TemplateHost: (props: { images: PortfolioImage[] }) => templateHostMock(props),
}));

import { TabbedTemplateHost } from './TabbedTemplateHost';

function makePortfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    id: 'p1',
    ownerId: 'u1',
    handle: 'alex',
    title: 'Alex',
    bio: '',
    templateId: 'simple-grid',
    templateConfig: {},
    galleryThemeId: 'ocean-depths',
    published: true,
    createdAt: '',
    updatedAt: '',
    folderDisplayMode: 'tabs',
    fontId: 'default',
    ...overrides,
  };
}

function makeFolder(overrides: Partial<ImageFolder> = {}): ImageFolder {
  return {
    id: overrides.id ?? 'f1',
    portfolioId: 'p1',
    name: overrides.name ?? 'Studio',
    position: overrides.position ?? 0,
    hidden: overrides.hidden ?? false,
    createdAt: '',
    ...overrides,
  };
}

function makeImage(id: string, folderId: string | null): PortfolioImage {
  return {
    id,
    portfolioId: 'p1',
    storagePath: `path/${id}`,
    url: `https://example.com/${id}`,
    title: '',
    description: '',
    altText: '',
    position: 0,
    width: null,
    height: null,
    folderId,
    createdAt: '',
  };
}

describe('TabbedTemplateHost', () => {
  it('renders an "All images" tab first, plus visible folders, and excludes hidden folders', async () => {
    const user = userEvent.setup();
    const portfolio = makePortfolio({ folderDisplayMode: 'tabs' });
    const folders = [
      makeFolder({ id: 'f1', name: 'Studio', position: 0 }),
      makeFolder({ id: 'f2', name: 'Outdoor', position: 1 }),
      makeFolder({ id: 'f3', name: 'Private', position: 2, hidden: true }),
    ];
    const images = [
      makeImage('a', 'f1'),
      makeImage('b', 'f1'),
      makeImage('c', 'f2'),
      makeImage('d', 'f3'), // in hidden folder
      makeImage('e', null), // unfiled
    ];

    render(<TabbedTemplateHost portfolio={portfolio} images={images} folders={folders} />);

    // Hidden folder absent from strip.
    expect(screen.queryByRole('tab', { name: 'Private' })).not.toBeInTheDocument();
    // "All images" tab present and is the first tab; "Unfiled" is gone.
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveTextContent('All images');
    expect(screen.queryByRole('tab', { name: 'Unfiled' })).not.toBeInTheDocument();
    // Visible folders also present.
    expect(screen.getByRole('tab', { name: 'Studio' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Outdoor' })).toBeInTheDocument();

    // Default (first) tab is "All images" — shows every visible image
    // (folder-tagged + untagged), but never the hidden folder's image.
    expect(screen.getByTestId('template-host').getAttribute('data-image-count')).toBe('4');

    // Switching to a folder narrows the set.
    await user.click(screen.getByRole('tab', { name: 'Studio' }));
    expect(screen.getByTestId('template-host').getAttribute('data-image-count')).toBe('2');
    await user.click(screen.getByRole('tab', { name: 'Outdoor' }));
    expect(screen.getByTestId('template-host').getAttribute('data-image-count')).toBe('1');
  });

  it('renders flat (no tabs) when display mode is flat', () => {
    const portfolio = makePortfolio({ folderDisplayMode: 'flat' });
    const folders = [makeFolder({ id: 'f1', name: 'Studio', position: 0 })];
    const images = [makeImage('a', 'f1'), makeImage('b', null)];

    render(<TabbedTemplateHost portfolio={portfolio} images={images} folders={folders} />);

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByTestId('template-host').getAttribute('data-image-count')).toBe('2');
  });

  it('falls back to flat when tabs requested but no folder contains images', () => {
    const portfolio = makePortfolio({ folderDisplayMode: 'tabs' });
    const folders: ImageFolder[] = [];
    const images = [makeImage('a', null), makeImage('b', null)];

    render(<TabbedTemplateHost portfolio={portfolio} images={images} folders={folders} />);

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByTestId('template-host').getAttribute('data-image-count')).toBe('2');
  });
});
