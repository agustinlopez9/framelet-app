import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Check, X, FolderClosed, Images, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { ImageFolder, PortfolioImage } from '@/types';
import {
  useCreateFolder,
  useDeleteFolder,
  useRenameFolder,
} from './queries';

export type FolderSelection = 'all' | string;

interface FolderRailProps {
  portfolioId: string;
  folders: ImageFolder[];
  images: PortfolioImage[];
  selected: FolderSelection;
  onSelect: (next: FolderSelection) => void;
}

export function FolderRail({ portfolioId, folders, images, selected, onSelect }: FolderRailProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<ImageFolder | null>(null);

  const allCount = images.length;
  const folderCounts = new Map<string, number>();
  for (const img of images) {
    if (img.folderId) folderCounts.set(img.folderId, (folderCounts.get(img.folderId) ?? 0) + 1);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Folders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-1">
          <PseudoEntry
            id="folder:all"
            label="All images"
            icon={<Images className="h-4 w-4" />}
            count={allCount}
            active={selected === 'all'}
            onSelect={() => onSelect('all')}
          />
        </ul>

        <SortableContext items={folders.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1">
            {folders.map((folder) => (
              <SortableFolderRailRow
                key={folder.id}
                folder={folder}
                portfolioId={portfolioId}
                count={folderCounts.get(folder.id) ?? 0}
                active={selected === folder.id}
                onSelect={() => onSelect(folder.id)}
                onRequestDelete={() => setDeleting(folder)}
              />
            ))}
          </ul>
        </SortableContext>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex w-full flex-col items-center gap-1 rounded-md border border-dashed py-3 text-xs text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          <span>Create new folder</span>
        </button>
      </CardContent>

      {createOpen ? (
        <CreateFolderDialog
          portfolioId={portfolioId}
          onClose={() => setCreateOpen(false)}
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
    </Card>
  );
}

function PseudoEntry({
  id,
  label,
  icon,
  count,
  active,
  onSelect,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  count: number;
  active: boolean;
  onSelect: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <li>
      <button
        ref={setNodeRef}
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          active
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          isOver && 'ring-2 ring-primary',
        )}
      >
        {icon}
        <span className="flex-1 text-left truncate">{label}</span>
        <span className="text-xs">{count}</span>
      </button>
    </li>
  );
}

function SortableFolderRailRow({
  folder,
  portfolioId,
  count,
  active,
  onSelect,
  onRequestDelete,
}: {
  folder: ImageFolder;
  portfolioId: string;
  count: number;
  active: boolean;
  onSelect: () => void;
  onRequestDelete: () => void;
}) {
  const sortable = useSortable({ id: folder.id, data: { type: 'folder' } });
  const drop = useDroppable({ id: `folder:${folder.id}` });
  const rename = useRenameFolder(portfolioId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(folder.name);

  const setRefs = (node: HTMLLIElement | null) => {
    sortable.setNodeRef(node);
    drop.setNodeRef(node);
  };

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.6 : 1,
  };

  async function commitRename() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === folder.name) {
      setEditing(false);
      setDraft(folder.name);
      return;
    }
    try {
      await rename.mutateAsync({ id: folder.id, name: trimmed });
      setEditing(false);
    } catch (err) {
      toast({
        title: 'Could not rename folder',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  }

  return (
    <li
      ref={setRefs}
      style={style}
      className={cn(
        'group flex items-center gap-1 rounded-md px-1 py-1 text-sm transition-colors',
        active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
        drop.isOver && 'ring-2 ring-primary',
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab text-muted-foreground hover:text-foreground"
        {...sortable.attributes}
        {...sortable.listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {editing ? (
        <div className="flex flex-1 items-center gap-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitRename();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setEditing(false);
                setDraft(folder.name);
              }
            }}
            ref={(el) => el?.focus()}
            maxLength={60}
            className="h-7 text-sm"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={commitRename}
            disabled={rename.isPending}
            aria-label="Save name"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => {
              setEditing(false);
              setDraft(folder.name);
            }}
            aria-label="Cancel rename"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onSelect}
            className="flex flex-1 items-center gap-2 truncate text-left"
          >
            <FolderClosed className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate">{folder.name}</span>
            <span className="text-xs text-muted-foreground">{count}</span>
          </button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => setEditing(true)}
            aria-label={`Rename ${folder.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={onRequestDelete}
            aria-label={`Delete ${folder.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </li>
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
