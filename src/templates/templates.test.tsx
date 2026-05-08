import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SimpleGrid from './simple-grid';
import SideTitles from './side-titles';
import AlternatingTitles from './alternating-titles';
import VerticalFocus from './vertical-focus';
import Gallery3D from './gallery-3d/Gallery3D';
import type { Portfolio, PortfolioImage } from '@/types';

function makePortfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    id: 'p1',
    ownerId: 'u1',
    handle: 'alex',
    title: 'Alex Photo',
    bio: 'Editorial fashion.',
    templateId: 'simple-grid',
    templateConfig: {},
    galleryThemeId: 'ocean-depths',
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fontId: 'default',
    fontScale: 'regular',
    socialLinks: [],
    ...overrides,
  };
}

function makeImages(n: number): PortfolioImage[] {
  return Array.from({ length: n }).map((_, i) => ({
    id: `img-${i}`,
    portfolioId: 'p1',
    storagePath: `u1/p1/img-${i}.jpg`,
    url: `https://example.com/img-${i}.jpg`,
    title: `Image ${i}`,
    description: `Desc ${i}`,
    altText: `Alt ${i}`,
    position: i,
    width: null,
    height: null,
    createdAt: new Date().toISOString(),
  }));
}

describe('simple-grid', () => {
  it('renders an empty portfolio without crashing', () => {
    render(<SimpleGrid portfolio={makePortfolio()} images={[]} config={{}} />);
    expect(screen.getByText('Alex Photo')).toBeInTheDocument();
    expect(screen.getByText('No images yet.')).toBeInTheDocument();
  });

  it('renders all images in order with alt text', () => {
    render(<SimpleGrid portfolio={makePortfolio()} images={makeImages(5)} config={{}} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(5);
    imgs.forEach((img, i) => {
      expect(img).toHaveAttribute('alt', `Alt ${i}`);
      expect(img).toHaveAttribute('src', `https://example.com/img-${i}.jpg`);
    });
  });
});

describe('side-titles', () => {
  it('renders an empty portfolio', () => {
    render(<SideTitles portfolio={makePortfolio()} images={[]} config={{}} />);
    expect(screen.getByText('No images yet.')).toBeInTheDocument();
  });

  it('renders a title and description for each image', () => {
    render(<SideTitles portfolio={makePortfolio()} images={makeImages(3)} config={{}} />);
    expect(screen.getByText('Image 0')).toBeInTheDocument();
    expect(screen.getByText('Image 1')).toBeInTheDocument();
    expect(screen.getByText('Image 2')).toBeInTheDocument();
    expect(screen.getByText('Desc 0')).toBeInTheDocument();
  });
});

describe('alternating-titles', () => {
  it('flips the rail side on each successive image', () => {
    const { container } = render(
      <AlternatingTitles portfolio={makePortfolio()} images={makeImages(4)} config={{}} />,
    );
    const articles = container.querySelectorAll('article[data-side]');
    expect(articles).toHaveLength(4);
    expect(articles[0]?.getAttribute('data-side')).toBe('right');
    expect(articles[1]?.getAttribute('data-side')).toBe('left');
    expect(articles[2]?.getAttribute('data-side')).toBe('right');
    expect(articles[3]?.getAttribute('data-side')).toBe('left');
  });
});

describe('vertical-focus', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders the empty state when there are no images', () => {
    render(<VerticalFocus portfolio={makePortfolio()} images={[]} config={{}} />);
    expect(screen.getByText('No images yet.')).toBeInTheDocument();
  });

  it('honors prefers-reduced-motion by skipping the animated styles', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    const { container } = render(
      <VerticalFocus portfolio={makePortfolio()} images={makeImages(3)} config={{}} />,
    );
    // Reduced motion → static unfocused styles, no transition.
    const items = container.querySelectorAll('div[style*="transform"]');
    expect(items.length).toBeGreaterThan(0);
    items.forEach((el) => {
      expect((el as HTMLElement).style.transition).toBe('none');
    });
  });
});

describe('gallery-3d', () => {
  beforeAll(() => {
    // JSDOM does not implement Pointer Capture; stub the methods Gallery3D
    // calls so the drag handlers can run without throwing.
    const proto = Element.prototype as unknown as {
      setPointerCapture?: (id: number) => void;
      releasePointerCapture?: (id: number) => void;
      hasPointerCapture?: (id: number) => boolean;
    };
    if (typeof proto.setPointerCapture !== 'function') {
      proto.setPointerCapture = () => {};
    }
    if (typeof proto.releasePointerCapture !== 'function') {
      proto.releasePointerCapture = () => {};
    }
    if (typeof proto.hasPointerCapture !== 'function') {
      proto.hasPointerCapture = () => false;
    }
  });

  function activeImageSrc(): string | null {
    const active = document.querySelector('button[aria-current="true"] img');
    return active?.getAttribute('src') ?? null;
  }

  it('advances the active image by one when the user drags ~one snap', () => {
    render(<Gallery3D portfolio={makePortfolio()} images={makeImages(5)} config={{}} />);
    expect(activeImageSrc()).toBe('https://example.com/img-0.jpg');

    const stage = screen.getByTestId('gallery-3d-stage');
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 300, button: 0 });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 200 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 200 });

    // Drag left by ~SNAP_PX (100) → next image.
    expect(activeImageSrc()).toBe('https://example.com/img-1.jpg');
  });

  it('advances by multiple images for a long swipe', () => {
    render(<Gallery3D portfolio={makePortfolio()} images={makeImages(5)} config={{}} />);
    const stage = screen.getByTestId('gallery-3d-stage');
    // 320px swipe ≈ 3 snaps → advance by 3.
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 400, button: 0 });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 80 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 80 });
    expect(activeImageSrc()).toBe('https://example.com/img-3.jpg');
  });

  it('does not advance when the drag is below the dead-zone', () => {
    render(<Gallery3D portfolio={makePortfolio()} images={makeImages(3)} config={{}} />);
    const stage = screen.getByTestId('gallery-3d-stage');
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 200, button: 0 });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 180 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 180 });

    expect(activeImageSrc()).toBe('https://example.com/img-0.jpg');
  });

  it('keeps responding to keyboard arrow controls', () => {
    render(<Gallery3D portfolio={makePortfolio()} images={makeImages(3)} config={{}} />);
    expect(activeImageSrc()).toBe('https://example.com/img-0.jpg');

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(activeImageSrc()).toBe('https://example.com/img-1.jpg');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(activeImageSrc()).toBe('https://example.com/img-0.jpg');
  });

  it('does not render side-mounted nav buttons or N/M counter', () => {
    render(<Gallery3D portfolio={makePortfolio()} images={makeImages(3)} config={{}} />);
    expect(screen.queryByRole('button', { name: 'Previous image' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next image' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^\d+\s*\/\s*\d+$/)).not.toBeInTheDocument();
  });
});
