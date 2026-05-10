export const portfoliosKey = ['portfolios', 'me'] as const;
export const portfolioKey = (id: string) => ['portfolio', id] as const;
export const userKey = ['user', 'me'] as const;
export const userPlanKey = (userId: string) => ['user', userId, 'plan'] as const;
export const imagesKey = (portfolioId: string) => ['portfolio', portfolioId, 'images'] as const;
export const mediaKey = (portfolioId: string) => ['portfolio', portfolioId, 'media'] as const;
export const foldersKey = (portfolioId: string) => ['portfolio', portfolioId, 'folders'] as const;
