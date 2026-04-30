import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Check, FolderClosed, Images, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { ImageFolder, PortfolioImage } from '@/types';
import {
  useCreateFolder,
  useDeleteFolder,
  useRenameFolder,
} from './queries';

export type FolderSelection = 'all' | string;

interface FolderTabStripProps {
  portfolioId: string;
  folders: ImageFolder[];
  images: PortfolioImage[];
  selected: FolderSelection;
  onSelect: (next: FolderSelection) => void;
}

/**
 * Horizontal folder tab strip. Each tab is a click-to-filter selector AND a
 * @dnd-kit drop target (id = `folder:${id}` or `folder:all`). The "+ Create
 * folder" button sits at the right end of the strip.
 *
 * Folder reordering is intentionally not supported here in this pass — folder
 * order falls back to the `position` returned by the API. Reordering inside a
 * horizontal tab strip would compete with horizontal scroll; revisit if
 * creators ask for it.
 */
export function FolderRail({ portfolioId, folders, images, selected, onSelect }: FolderTabStripProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<ImageFolder | null>(null);
  const [renaming, setRenaming] = useState<ImageFolder | null>(null);

  const allCount = images.length;
  const folderCounts = new Map<string, number>();
  for (const img of images) {
    if (img.folderId) folderCounts.set(img.folderId, (folderCounts.get(img.folderId) ?? 0) + 1);
  }

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <FolderTab
          dropId="folder:all"
          icon={<Images className="h-4 w-4 shrink-0" />}
          label="All images"
          count={allCount}
          active={selected === 'all'}
          onSelect={() => onSelect('all')}
        />
        {folders.map((folder) => (
          <FolderTab
            key={folder.id}
            dropId={`folder:${folder.id}`}
            icon={<FolderClosed className="h-4 w-4 shrink-0" />}
            label={folder.name}
            count={folderCounts.get(folder.id) ?? 0}
            active={selected === folder.id}
            onSelect={() => onSelect(folder.id)}
            menu={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label={`Folder actions for ${folder.name}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-base leading-none">⋮</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setRenaming(folder)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setDeleting(folder)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        ))}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setCreateOpen(true)}
          aria-label="Create folder"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {createOpen ? (
        <CreateFolderDialog
          portfolioId={portfolioId}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}

      {renaming ? (
        <RenameFolderDialog
          folder={renaming}
          portfolioId={portfolioId}
          onClose={() => setRenaming(null)}
        />
      ) : null}

      {deleting ? (
        <DeleteFolderDialog
          folder={deleting}
          portfolioId={portfolioId}
          imageCount={folderCounts.get(deleting.id) ?? 0}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            if (selected === deleting.id) onSelect('all');
          }}
        />
      ) : null}
    </>
  );
}

function FolderTab({
  dropId,
  icon,
  label,
  count,
  active,
  onSelect,
  menu,
}: {
  dropId: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  active: boolean;
  onSelect: () => void;
  menu?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dropId });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group/tab flex h-9 max-w-[300px] shrink-0 items-center gap-2 rounded-md border px-3 text-sm transition-colors',
        active
          ? 'border-primary/40 bg-accent text-accent-foreground'
          : 'border-input bg-background text-foreground hover:bg-accent/50',
        isOver && 'ring-2 ring-primary',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 items-center gap-2 truncate text-left"
      >
        {icon}
        <span className="truncate">{label}</span>
        <span className="ml-1 shrink-0 text-sm font-semibold text-foreground/80">{count}</span>
      </button>
      {menu}
    </div>
  );
}

function CreateFolderDialog({
  portfolioId,
  onClose,
}: {
  portfolioId: string;
  onClose: () => void;
}) {
  const create = useCreateFolder(portfolioId);
  const [name, setName] = useState('');
  const [hidden, setHidden] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await create.mutateAsync({ name: trimmed, hidden });
      onClose();
    } catch (err) {
      toast({
        title: 'Could not create folder',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  }

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create folder</DialogTitle>
          <DialogDescription>Group images and choose whether the folder is publicly visible.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-folder-name">Name</Label>
            <Input
              id="new-folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="e.g. Travel"
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="new-folder-hidden">Hidden</Label>
              <p className="text-xs text-muted-foreground">Only visible to you. Won't show on your public portfolio.</p>
            </div>
            <Switch
              id="new-folder-hidden"
              checked={hidden}
              onCheckedChange={setHidden}
              aria-label="Hide folder from public portfolio"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={create.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              {create.isPending ? 'Creating…' : 'Create folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RenameFolderDialog({
  folder,
  portfolioId,
  onClose,
}: {
  folder: ImageFolder;
  portfolioId: string;
  onClose: () => void;
}) {
  const rename = useRenameFolder(portfolioId);
  const [name, setName] = useState(folder.name);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === folder.name) {
      onClose();
      return;
    }
    try {
      await rename.mutateAsync({ id: folder.id, name: trimmed });
      onClose();
    } catch (err) {
      toast({
        title: 'Could not rename folder',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  }

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename folder</DialogTitle>
          <DialogDescription>Pick a new name for this folder.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rename-folder-name">Name</Label>
            <Input
              id="rename-folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  onClose();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={rename.isPending}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={rename.isPending || !name.trim()}>
              <Check className="mr-2 h-4 w-4" />
              {rename.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteFolderDialog({
  folder,
  portfolioId,
  imageCount,
  onClose,
  onDeleted,
}: {
  folder: ImageFolder;
  portfolioId: string;
  imageCount: number;
  onClose: () => void;
  onDeleted: () => void;
}) {
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
