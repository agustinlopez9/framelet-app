export interface User {
  id: string;
  email: string;
  handle: string;
  createdAt: string;
}

export interface Portfolio {
  id: string;
  ownerId: string;
  handle: string;
  title: string;
  bio: string;
  templateId: string;
  templateConfig: TemplateConfig;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioImage {
  id: string;
  portfolioId: string;
  storagePath: string;
  url: string;
  title: string;
  description: string;
  altText: string;
  position: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export type TemplateConfig = Record<string, unknown>;
