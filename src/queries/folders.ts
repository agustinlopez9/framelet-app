import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFolder,
  deleteFolder,
  listFolders,
  renameFolder,
  reorderFolders,
  setFolderHidden,
  type CreateFolderInput,
} from '@/lib/api/folders';
import { deleteImage } from '@/lib/api/images';
import { foldersKey, imagesKey, mediaKey, userKey } from '@/lib/queryKeys';
import type { ImageFolder, PortfolioImage } from '@/features/portfolio/types';

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
