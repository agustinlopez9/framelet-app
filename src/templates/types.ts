import type { ComponentType } from 'react';
import type { Portfolio, PortfolioImage, TemplateConfig } from '@/types';

export interface TemplateProps<C extends TemplateConfig = TemplateConfig> {
  portfolio: Portfolio;
  images: PortfolioImage[];
  config: C;
  // True when rendered inside the dashboard preview. Templates that own
  // viewer features (e.g. fullscreen) MUST suppress them here because the
  // preview is wrapped in a transform-scaled ancestor.
  inPreview?: boolean;
  // True when the host is rendering the portfolio header (title + bio) itself
  // — e.g. above a folder tab strip. Templates skip their own header block
  // so the title doesn't appear twice.
  hideHeader?: boolean;
}

export interface Template<C extends TemplateConfig = TemplateConfig> {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  defaultConfig: C;
  // When false, the template owns its own image-by-image navigation and the
  // public-showcase host MUST NOT attach the shared lightbox. Defaults to true.
  interactive?: boolean;
  premiumOnly?: boolean;
  loadComponent(): Promise<ComponentType<TemplateProps<C>>>;
}
