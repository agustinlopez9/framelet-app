import { Facebook, Globe, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import type { Portfolio, SocialPlatform } from '@/features/portfolio/types';

type IconComponent = (props: { className?: string; 'aria-hidden'?: boolean }) => JSX.Element;

const TikTokIcon: IconComponent = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.5 2c.3 1.7 1.2 3.1 2.6 4 .9.6 1.9 1 2.9 1V11c-1.7 0-3.4-.5-4.9-1.4v6.1c0 4.6-3.7 8.3-8.3 8.3S1.5 20.3 1.5 15.7s3.7-8.3 8.3-8.3c.4 0 .8 0 1.2.1V11c-.4-.1-.8-.2-1.2-.2-2.7 0-4.9 2.2-4.9 4.9s2.2 4.9 4.9 4.9 4.9-2.2 4.9-4.9V2h2.8z" />
  </svg>
);

const PinterestIcon: IconComponent = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C6.5 2 2 6.5 2 12c0 4.2 2.6 7.7 6.2 9.2-.1-.8-.2-2 0-2.8.2-.8 1.1-4.7 1.1-4.7s-.3-.6-.3-1.4c0-1.3.8-2.3 1.7-2.3.8 0 1.2.6 1.2 1.4 0 .8-.5 2-.8 3.1-.2.9.5 1.7 1.4 1.7 1.7 0 3-1.8 3-4.4 0-2.3-1.6-3.9-4-3.9-2.7 0-4.3 2-4.3 4.1 0 .8.3 1.7.7 2.2.1.1.1.2.1.3l-.3 1.1c0 .2-.2.2-.4.1-1.2-.6-2-2.4-2-3.8 0-3.1 2.2-5.9 6.4-5.9 3.4 0 6 2.4 6 5.6 0 3.4-2.1 6.1-5.1 6.1-1 0-1.9-.5-2.2-1.1l-.6 2.3c-.2.8-.8 1.9-1.2 2.5C10 22 11 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2z" />
  </svg>
);

const PLATFORM_META: Record<SocialPlatform, { label: string; Icon: IconComponent }> = {
  instagram: { label: 'Instagram', Icon: Instagram as unknown as IconComponent },
  facebook: { label: 'Facebook', Icon: Facebook as unknown as IconComponent },
  twitter: { label: 'Twitter', Icon: Twitter as unknown as IconComponent },
  youtube: { label: 'YouTube', Icon: Youtube as unknown as IconComponent },
  tiktok: { label: 'TikTok', Icon: TikTokIcon },
  linkedin: { label: 'LinkedIn', Icon: Linkedin as unknown as IconComponent },
  pinterest: { label: 'Pinterest', Icon: PinterestIcon },
  other: { label: 'Link', Icon: Globe as unknown as IconComponent },
};

export function platformMeta(platform: SocialPlatform) {
  return PLATFORM_META[platform];
}

interface PortfolioFooterProps {
  portfolio: Portfolio;
}

export function PortfolioFooter({ portfolio }: PortfolioFooterProps) {
  const links = portfolio.socialLinks;

  return (
    <footer className="mx-auto mt-16 flex max-w-6xl flex-col items-center gap-4 px-4 pb-8 pt-12 text-sm">
      {links.length > 0 ? (
        <ul className="flex flex-wrap items-center justify-center gap-4">
          {links.map((link, idx) => {
            const meta = PLATFORM_META[link.platform];
            const ariaLabel =
              link.platform === 'other' && link.label?.trim() ? link.label : meta.label;
            return (
              <li key={`${link.platform}-${idx}`}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={ariaLabel}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <meta.Icon className="h-5 w-5" aria-hidden />
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Made with{' '}
        <a
          href="https://framelet.app/"
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium underline-offset-2 hover:underline"
        >
          Framelet
        </a>
      </p>
    </footer>
  );
}
