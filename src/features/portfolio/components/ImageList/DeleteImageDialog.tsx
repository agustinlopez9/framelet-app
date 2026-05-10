import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FolderClosed, Home } from 'lucide-react';
import type { ImageFolder, PortfolioImage } from '@/features/portfolio/types';
import { useDeleteImage } from '@/queries';
import { toast } from '@/hooks/use-toast';

export function DeleteImageDialog({
  image,
  portfolioId,
  onClose,
  onDeleted,
}: {
  image: PortfolioImage;
  portfolioId: string;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const del = useDeleteImage(portfolioId);

  async function onConfirm() {
    try {
      await del.mutateAsync(image);
      toast({ title: 'Image deleted' });
      onDeleted?.();
      onClose();
    } catch (err) {
      toast({
        title: 'Could not delete image',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  }

  return (
    <ConfirmDialog
      open
      title="Delete this image?"
      description="This permanently removes the file. There's no undo."
      confirmLabel={del.isPending ? 'Deleting…' : 'Delete'}
      destructive
      busy={del.isPending}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}

export function BulkDeleteDialog({
  ids,
  images,
  portfolioId,
  onClose,
  onAllDeleted,
}: {
  ids: string[];
  images: PortfolioImage[];
  portfolioId: string;
  onClose: () => void;
  onAllDeleted: () => void;
}) {
  const del = useDeleteImage(portfolioId);
  const [busy, setBusy] = useState(false);

  async function onConfirm() {
    setBusy(true);
    const targets = images.filter((img) => ids.includes(img.id));
    const results = await Promise.allSettled(targets.map((img) => del.mutateAsync(img)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    setBusy(false);
    if (failed > 0) {
      toast({
        title: `Deleted ${targets.length - failed} of ${targets.length}`,
        description: `${failed} could not be deleted. They were left in place.`,
        variant: 'destructive',
      });
    } else {
      toast({ title: `Deleted ${targets.length} image${targets.length === 1 ? '' : 's'}` });
    }
    onAllDeleted();
    onClose();
  }

  return (
    <ConfirmDialog
      open
      title={`Delete ${ids.length} image${ids.length === 1 ? '' : 's'}?`}
      description="This permanently removes the files. There's no undo."
      confirmLabel={busy ? 'Deleting…' : `Delete ${ids.length}`}
      destructive
      busy={busy}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}

export function MovePickerDialog({
  folders,
  count,
  onClose,
  onPick,
}: {
  folders: ImageFolder[];
  count: number;
  onClose: () => void;
  onPick: (folderId: string | null) => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function pick(folderId: string | null) {
    setBusy(true);
    try {
      await onPick(folderId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => (!o && !busy ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Move {count} image{count === 1 ? '' : 's'} to…
          </DialogTitle>
          <DialogDescription>Pick a destination folder.</DialogDescription>
        </DialogHeader>
        <ul className="max-h-72 overflow-auto rounded-md border">
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => pick(null)}
              disabled={busy}
            >
              <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>Root</span>
            </button>
          </li>
          {folders.map((folder) => (
            <li key={folder.id} className="border-t">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => pick(folder.id)}
                disabled={busy}
              >
                <FolderClosed className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{folder.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
