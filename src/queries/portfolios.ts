import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyPortfolios,
  getPortfolioById,
  updatePortfolio,
  setDefaultPortfolio,
  createPortfolio,
  type UpdatePortfolioInput,
  type CreatePortfolioInput,
} from '@/lib/api/portfolios';
import { portfoliosKey, portfolioKey } from '@/lib/queryKeys';

export function useMyPortfolios() {
  return useQuery({
    queryKey: portfoliosKey,
    queryFn: getMyPortfolios,
  });
}

export function usePortfolio(portfolioId: string | undefined) {
  return useQuery({
    queryKey: portfolioId ? portfolioKey(portfolioId) : ['portfolio', 'idle'],
    queryFn: () => getPortfolioById(portfolioId!),
    enabled: !!portfolioId,
  });
}

export function useCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePortfolioInput) => createPortfolio(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: portfoliosKey });
    },
  });
}

export function useSetDefaultPortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (portfolioId: string) => setDefaultPortfolio(portfolioId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: portfoliosKey });
    },
  });
}

export function useUpdatePortfolio(portfolioId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: UpdatePortfolioInput }) =>
      updatePortfolio(id, patch),
    onSuccess: (next) => {
      if (portfolioId) qc.setQueryData(portfolioKey(portfolioId), next);
      qc.invalidateQueries({ queryKey: portfoliosKey });
    },
  });
}
