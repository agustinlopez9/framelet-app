import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyPortfolio, updatePortfolio, type UpdatePortfolioInput } from '@/lib/api/portfolios';
import {
  deleteImage,
  listImages,
  reorderImages,
  updateImage,
  type UpdateImageInput,
} from '@/lib/api/images';
import type { PortfolioImage } from '@/types';

export const portfolioKey = ['portfolio', 'me'] as const;
export const imagesKey = (portfolioId: string) => ['portfolio', portfolioId, 'images'] as const;

export function useMyPortfolio() {
  return useQuery({
    queryKey: portfolioKey,
    queryFn: getMyPortfolio,
  });
}

export function useImages(portfolioId: string | undefined) {
  return useQuery({
    queryKey: portfolioId ? imagesKey(portfolioId) : ['portfolio', 'images', 'idle'],
    queryFn: () => listImages(portfolioId!),
    enabled: !!portfolioId,
  });
}

export function useUpdatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: UpdatePortfolioInput }) =>
      updatePortfolio(id, patch),
    onSuccess: (next) => {
      qc.setQueryData(portfolioKey, next);
    },
  });
}

export function useUpdateImage(portfolioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: UpdateImageInput }) =>
      updateImage(id, patch),
    onSuccess: (next) => {
      qc.setQueryData<PortfolioImage[]>(imagesKey(portfolioId), (prev) =>
        prev?.map((img) => (img.id === next.id ? next : img)),
      );
    },
  });
}

export function useDeleteImage(portfolioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (image: PortfolioImage) => {
      await deleteImage(image);
      return image.id;
    },
    onSuccess: (id) => {
      qc.setQueryData<PortfolioImage[]>(imagesKey(portfolioId), (prev) =>
        prev?.filter((img) => img.id !== id),
      );
    },
  });
}

export function useReorderImages(portfolioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ordered: PortfolioImage[]) => {
      await reorderImages(ordered);
      return ordered;
    },
    onSuccess: (ordered) => {
      qc.setQueryData<PortfolioImage[]>(imagesKey(portfolioId), ordered);
    },
  });
}
