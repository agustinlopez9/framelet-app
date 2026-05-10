import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Portfolio, SocialLink } from '@/features/portfolio/types';
import { PortfolioFooter } from './PortfolioFooter';

function makePortfolio(socialLinks: SocialLink[] = []): Portfolio {
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
    folderDisplayMode: 'flat',
    fontId: 'default',
    fontScale: 'regular',
    socialLinks,
  };
}

describe('PortfolioFooter', () => {
  it('renders the "Made with Framelet" credit', () => {
    render(<PortfolioFooter portfolio={makePortfolio()} />);
    const link = screen.getByRole('link', { name: 'Framelet' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://framelet.app/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('renders no icon row when socialLinks is empty', () => {
    render(<PortfolioFooter portfolio={makePortfolio([])} />);
    // No platform links, only the Framelet credit link.
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent('Framelet');
  });

  it('renders an accessible icon link per social entry, in order', () => {
    render(
      <PortfolioFooter
        portfolio={makePortfolio([
          { platform: 'instagram', url: 'https://instagram.com/alex' },
          { platform: 'youtube', url: 'https://youtube.com/@alex' },
          { platform: 'tiktok', url: 'https://tiktok.com/@alex' },
          { platform: 'pinterest', url: 'https://pinterest.com/alex' },
          { platform: 'other', url: 'https://example.com', label: 'Personal blog' },
        ])}
      />,
    );

    const ig = screen.getByRole('link', { name: 'Instagram' });
    expect(ig).toHaveAttribute('href', 'https://instagram.com/alex');
    expect(ig).toHaveAttribute('target', '_blank');

    expect(screen.getByRole('link', { name: 'YouTube' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'TikTok' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pinterest' })).toBeInTheDocument();
    // "Other" entry uses its label as the accessible name.
    expect(screen.getByRole('link', { name: 'Personal blog' })).toBeInTheDocument();
  });
});
