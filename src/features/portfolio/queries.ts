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
import {
  deleteImage,
  listImages,
  reorderImages,
  updateImage,
  type UpdateImageInput,
} from '@/lib/api/images';
import { listMedia, reorderMedia } from '@/lib/api/media';
import {
  createFolder,
  deleteFolder,
  listFolders,
  renameFolder,
  reorderFolders,
  setFolderHidden,
  type CreateFolderInput,
} from '@/lib/api/folders';
import { setMyUsername, getMyUser } from '@/lib/api/auth';
import { getUserPlan } from '@/lib/api/subscriptions';
import type { ImageFolder, MediaItem, Portfolio, PortfolioImage } from '@/types';

export const portfoliosKey = ['portfolios', 'me'] as const;
export const portfolioKey = (id: string) => ['portfolio', id] as const;
export const userKey = ['user', 'me'] as const;
export const userPlanKey = (userId: string) => ['user', userId, 'plan'] as const;
export const imagesKey = (portfolioId: string) => ['portfolio', portfolioId, 'images'] as const;
export const mediaKey = (portfolioId: string) => ['portfolio', portfolioId, 'media'] as const;
export const foldersKey = (portfolioId: string) => ['portfolio', portfolioId, 'folders'] as const;

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

export function useMyUser() {
  return useQuery({
    queryKey: userKey,
    queryFn: getMyUser,
  });
}

export function useUserPlan(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? userPlanKey(userId) : ['user', 'plan', 'idle'],
    queryFn: () => getUserPlan(userId!),
    enabled: !!userId,
  });
}

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

export function useUpdateUsername() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      await setMyUsername(username);
      return username.toLowerCase();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKey });
    },
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

export function useFolders(portfolioId: string | undefined) {
  return useQuery({
    queryKey: portfolioId ? foldersKey(portfolioId) : ['portfolio', 'folders', 'idle'],
    queryFn: () => listFolders(portfolioId!),
    enabled: !!portfolioId,
  });
}

export function useCreateFolder(portfolioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFolderInput) => createFolder(portfolioId, input),
    onSuccess: (next) => {
      qc.setQueryData<ImageFolder[]>(foldersKey(portfolioId), (prev) => [...(prev ?? []), next]);
    },
  });
}

export function useRenameFolder(portfolioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameFolder(id, name),
    onSuccess: (next) => {
      qc.setQueryData<ImageFolder[]>(foldersKey(portfolioId), (prev) =>
        prev?.map((f) => (f.id === next.id ? next : f)),
      );
    },
  });
}

export function useReorderFolders(portfolioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ordered: ImageFolder[]) => {
      await reorderFolders(ordered, portfolioId);
      return ordered.map((f, idx) => ({ ...f, position: idx }));
    },
    onSuccess: (ordered) => {
      qc.setQueryData<ImageFolder[]>(foldersKey(portfolioId), ordered);
    },
  });
}

export function useSetFolderHidden(portfolioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) => setFolderHidden(id, hidden),
    onSuccess: (next) => {
      qc.setQueryData<ImageFolder[]>(foldersKey(portfolioId), (prev) =>
        prev?.map((f) => (f.id === next.id ? next : f)),
      );
    },
  });
}

export function useDeleteFolder(portfolioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const cachedImages = qc.getQueryData<PortfolioImage[]>(imagesKey(portfolioId)) ?? [];
      const inFolder = cachedImages.filter((img) => img.folderId === id);
      await Promise.all(inFolder.map((img) => deleteImage(img)));
      await deleteFolder(id);
      return { id, deletedImageIds: inFolder.map((img) => img.id) };
    },
    onSuccess: ({ id, deletedImageIds }) => {
      qc.setQueryData<ImageFolder[]>(foldersKey(portfolioId), (prev) =>
        prev?.filter((f) => f.id !== id),
      );
      qc.setQueryData<PortfolioImage[]>(imagesKey(portfolioId), (prev) =>
        prev?.filter((img) => !deletedImageIds.includes(img.id)),
      );
      qc.invalidateQueries({ queryKey: mediaKey(portfolioId) });
      qc.invalidateQueries({ queryKey: userKey });
    },
  });
}
