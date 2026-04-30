import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyPortfolio, updatePortfolio, type UpdatePortfolioInput } from '@/lib/api/portfolios';
import {
  deleteImage,
  listImages,
  reorderImages,
  updateImage,
  type UpdateImageInput,
} from '@/lib/api/images';
import {
  createFolder,
  deleteFolder,
  listFolders,
  renameFolder,
  reorderFolders,
  setFolderHidden,
  type CreateFolderInput,
} from '@/lib/api/folders';
import { setMyHandle } from '@/lib/api/auth';
import type { ImageFolder, PortfolioImage } from '@/types';

export const portfolioKey = ['portfolio', 'me'] as const;
export const imagesKey = (portfolioId: string) => ['portfolio', portfolioId, 'images'] as const;
export const foldersKey = (portfolioId: string) => ['portfolio', portfolioId, 'folders'] as const;

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

export function useUpdateHandle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (handle: string) => {
      await setMyHandle(handle);
      return handle.toLowerCase();
    },
    onSuccess: (handle) => {
      qc.setQueryData<Awaited<ReturnType<typeof getMyPortfolio>>>(portfolioKey, (prev) =>
        prev ? { ...prev, handle } : prev,
      );
      qc.invalidateQueries({ queryKey: portfolioKey });
    },
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
      await reorderFolders(ordered);
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
    },
  });
}
