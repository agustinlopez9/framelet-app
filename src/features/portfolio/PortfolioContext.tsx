import { createContext, useContext } from 'react';
import type { Portfolio, User, UserPlan } from '@/types';

interface PortfolioContextValue {
  portfolio: Portfolio;
  user: User;
  plan: UserPlan;
}

export const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function usePortfolioContext(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolioContext must be used within PortfolioLayout');
  return ctx;
}
