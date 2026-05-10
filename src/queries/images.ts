import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteImage,
  listImages,
  reorderImages,
  updateImage,
  type UpdateImageInput,
} from '@/lib/api/images';
import { listMedia, reorderMedia } from '@/lib/api/media';
import { imagesKey, mediaKey, userKey } from '@/lib/queryKeys';
import type { MediaItem, PortfolioImage } from '@/features/portfolio/types';

export function useImages(portfolioId: string | undefined) {
  return useQuery({
    queryKey: portfolioId ? imagesKey(portfolioId) : ['portfolio', 'images', 'idle'],
    queryFn: () => listImages(portfolioId!),
    enabled: !!portfolioId,
  });
}

export function useMedia(portfolioId: string | undefined) {
  return useQuery({
    queryKey: portfolioId ? mediaKey(portfolioId) : ['portfolio', 'media', 'idle'],
    queryFn: () => listMedia(portfolioId!),
    enabled: !!portfolioId,
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
      qc.invalidateQueries({ queryKey: mediaKey(portfolioId) });
      qc.invalidateQueries({ queryKey: userKey });
    },
  });
}

export function useReorderImages(portfolioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ordered: PortfolioImage[]) => {
      await reorderImages(ordered, portfolioId);
      return ordered;
    },
    onSuccess: (ordered) => {
      qc.setQueryData<PortfolioImage[]>(imagesKey(portfolioId), ordered);
    },
  });
}

export function useReorderMedia(portfolioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ordered: MediaItem[]) => {
      await reorderMedia(ordered, portfolioId);
      return ordered;
    },
    onSuccess: (ordered) => {
      qc.setQueryData<MediaItem[]>(mediaKey(portfolioId), ordered);
    },
  });
}
