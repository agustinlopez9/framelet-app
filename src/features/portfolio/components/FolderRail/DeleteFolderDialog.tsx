import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/hooks/use-toast';
import type { ImageFolder } from '@/features/portfolio/types';
import { useDeleteFolder } from '@/queries';

interface DeleteFolderDialogProps {
  folder: ImageFolder;
  portfolioId: string;
  imageCount: number;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteFolderDialog({
  folder,
  portfolioId,
  imageCount,
  onClose,
  onDeleted,
}: DeleteFolderDialogProps) {
  const remove = useDeleteFolder(portfolioId);

  async function onConfirm() {
    try {
      await remove.mutateAsync(folder.id);
      toast({
        title: `Deleted "${folder.name}"`,
        description:
          imageCount > 0
            ? `Removed the folder and ${imageCount} image${imageCount === 1 ? '' : 's'}.`
            : 'Removed the folder.',
      });
      onDeleted();
      onClose();
    } catch (err) {
      toast({
        title: 'Could not delete folder',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  }

  return (
    <ConfirmDialog
      open
      title={`Delete "${folder.name}"?`}
      description={
        imageCount > 0
          ? `This will permanently delete the folder and the ${imageCount} image${imageCount === 1 ? '' : 's'} inside it. There's no undo.`
          : `This will delete the folder. There's no undo.`
      }
      confirmLabel={remove.isPending ? 'Deleting…' : 'Delete folder'}
      destructive
      busy={remove.isPending}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
