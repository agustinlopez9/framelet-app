import { useState } from 'react';
import { SortableContext, useSortable, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Trash2,
  Pencil,
  GripVertical,
  FolderInput,
  FolderClosed,
  Eye,
  Home,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import type { ImageFolder, PortfolioImage } from '@/types';
import { useDeleteImage, useFolders, useUpdateImage } from './queries';
import { imageMetadataSchema, type ImageMetadataValues } from './schemas';
import { toast } from '@/hooks/use-toast';
import type { ViewMode } from './useViewMode';
import { FolderRail, type FolderSelection } from './FolderRail';

interface ImageListProps {
  portfolioId: string;
  images: PortfolioImage[];
  folders: ImageFolder[];
  allImages: PortfolioImage[];
  selected: FolderSelection;
  onSelectFolder: (next: FolderSelection) => void;
  selection: Set<string>;
  onToggleSelection: (id: string) => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onMoveSelected: (folderId: string | null) => void | Promise<void>;
  onOpenViewer: (image: PortfolioImage) => void;
  viewMode: ViewMode;
  onViewModeChange: (next: ViewMode) => void;
  emptyHint?: string;
}

export function ImageList({
  portfolioId,
  images,
  folders,
  allImages,
  selected,
  onSelectFolder,
  selection,
  onToggleSelection,
  onClearSelection,
  onSelectAll,
  onMoveSelected,
  onOpenViewer,
  viewMode,
  onViewModeChange,
  emptyHint,
}: ImageListProps) {
  const [editing, setEditing] = useState<PortfolioImage | null>(null);
  const [deleting, setDeleting] = useState<PortfolioImage | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [movePickerOpen, setMovePickerOpen] = useState(false);

  const allInViewSelected = images.length > 0 && images.every((img) => selection.has(img.id));
  const folderById = new Map(folders.map((f) => [f.id, f]));

  return (
    <Card className="relative">
      <CardHeader className="space-y-3">
        <FolderRail
          portfolioId={portfolioId}
          folders={folders}
          images={allImages}
          selected={selected}
          onSelect={onSelectFolder}
        />
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            size="icon"
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => onViewModeChange('grid')}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            className="h-8 w-8"
            onClick={() => onViewModeChange('list')}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {selection.size > 0 ? (
          <BulkActionBar
            count={selection.size}
            allInViewSelected={allInViewSelected}
            onSelectAll={onSelectAll}
            onMove={() => setMovePickerOpen(true)}
            onDelete={() => setBulkDeleteOpen(true)}
            onClear={onClearSelection}
          />
        ) : null}
        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {emptyHint ?? 'No images here yet. Upload some above.'}
          </p>
        ) : viewMode === 'grid' ? (
          <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {images.map((image) => (
                <SortableImageCard
                  key={image.id}
                  image={image}
                  selected={selection.has(image.id)}
                  selectionActive={selection.size > 0}
                  onToggleSelection={() => onToggleSelection(image.id)}
                  onEdit={() => setEditing(image)}
                  onDelete={() => setDeleting(image)}
                  onView={() => onOpenViewer(image)}
                />
              ))}
            </div>
          </SortableContext>
        ) : (
          <SortableContext items={images.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y rounded-md border">
              {images.map((image) => (
                <SortableImageRow
                  key={image.id}
                  image={image}
                  folderName={image.folderId ? folderById.get(image.folderId)?.name : undefined}
                  showFolderSubtitle={selected === 'all'}
                  selected={selection.has(image.id)}
                  onToggleSelection={() => onToggleSelection(image.id)}
                  onEdit={() => setEditing(image)}
                  onDelete={() => setDeleting(image)}
                  onView={() => onOpenViewer(image)}
                />
              ))}
            </ul>
          </SortableContext>
        )}
      </CardContent>

      {editing ? (
        <EditDialog image={editing} portfolioId={portfolioId} onClose={() => setEditing(null)} />
      ) : null}
      {deleting ? (
        <DeleteImageConfirm
          image={deleting}
          portfolioId={portfolioId}
          onClose={() => setDeleting(null)}
        />
      ) : null}
      {bulkDeleteOpen ? (
        <BulkDeleteConfirm
          ids={Array.from(selection)}
          images={images.filter((img) => selection.has(img.id))}
          allImages={images}
          portfolioId={portfolioId}
          onClose={() => setBulkDeleteOpen(false)}
          onAllDeleted={onClearSelection}
        />
      ) : null}
      {movePickerOpen ? (
        <MovePickerDialog
          folders={folders}
          count={selection.size}
          onClose={() => setMovePickerOpen(false)}
          onPick={async (folderId) => {
            await onMoveSelected(folderId);
            setMovePickerOpen(false);
          }}
        />
      ) : null}
    </Card>
  );
}

function BulkActionBar({
  count,
  allInViewSelected,
  onSelectAll,
  onMove,
  onDelete,
  onClear,
}: {
  count: number;
  allInViewSelected: boolean;
  onSelectAll: () => void;
  onMove: () => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  return (
    <div className="sticky top-2 z-10 mb-4 flex items-center gap-2 rounded-md border bg-card/95 px-2 py-1 shadow-sm backdrop-blur">
      <span className="text-sm text-muted-foreground">{count} selected</span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 text-xs"
        onClick={allInViewSelected ? onClear : onSelectAll}
      >
        {allInViewSelected ? 'Deselect all' : 'Select all'}
      </Button>
      <div className="ml-auto flex items-center gap-2">
        <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={onMove} aria-label="Move selected to folder">
          <FolderInput className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="destructive" className="h-7 w-7" onClick={onDelete} aria-label="Delete selected">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onClear}
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SortableImageCard({
  image,
  selected,
  selectionActive,
  onToggleSelection,
  onEdit,
  onDelete,
  onView,
}: {
  image: PortfolioImage;
  selected: boolean;
  selectionActive: boolean;
  onToggleSelection: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
    data: { type: 'image' },
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative overflow-hidden rounded-md border',
        selected && 'ring-2 ring-primary',
      )}
    >
      <img
        src={image.url}
        alt={image.altText || image.title || 'Portfolio image'}
        className="aspect-square w-full object-cover"
        loading="lazy"
      />
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelection}
        aria-label={selected ? 'Deselect image' : 'Select image'}
        className={cn(
          'absolute left-2.5 top-2.5 z-10 h-5 w-5 cursor-pointer rounded border-input bg-background/90 transition-opacity',
          selected || selectionActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/60 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder or onto a folder"
          className="pointer-events-auto absolute right-2 top-2 rounded bg-black/50 p-1 text-white"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={onView}
          aria-label="View image fullscreen"
          className="pointer-events-auto absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
        >
          <Eye className="h-5 w-5" />
        </Button>
        <div className="pointer-events-auto absolute bottom-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                aria-label="Image actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function SortableImageRow({
  image,
  folderName,
  showFolderSubtitle,
  selected,
  onToggleSelection,
  onEdit,
  onDelete,
  onView,
}: {
  image: PortfolioImage;
  folderName?: string;
  showFolderSubtitle: boolean;
  selected: boolean;
  onToggleSelection: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
    data: { type: 'image' },
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-3 py-2',
        selected && 'bg-accent/40',
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelection}
        aria-label={selected ? 'Deselect image' : 'Select image'}
        className="h-5 w-5 cursor-pointer"
      />
      <button
        type="button"
        aria-label="Drag to reorder or onto a folder"
        className="cursor-grab text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <img
        src={image.url}
        alt={image.altText || image.title || 'Portfolio image'}
        className="h-12 w-12 shrink-0 rounded object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{image.title || 'Untitled'}</p>
        {showFolderSubtitle && folderName ? (
          <p className="truncate text-xs text-muted-foreground">{folderName}</p>
        ) : null}
      </div>
      <Button size="icon" variant="ghost" onClick={onView} aria-label="View image fullscreen">
        <Eye className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Image actions">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

export function EditDialog({
  image,
  portfolioId,
  onClose,
}: {
  image: PortfolioImage;
  portfolioId: string;
  onClose: () => void;
}) {
  const update = useUpdateImage(portfolioId);
  const folders = useFolders(portfolioId);
  const form = useForm<ImageMetadataValues>({
    resolver: zodResolver(imageMetadataSchema),
    defaultValues: {
      title: image.title,
      description: image.description,
      altText: image.altText,
      folderId: image.folderId ?? null,
    },
  });

  async function onSubmit(values: ImageMetadataValues) {
    try {
      await update.mutateAsync({ id: image.id, patch: values });
      toast({ title: 'Image updated' });
      onClose();
    } catch (err) {
      toast({
        title: 'Could not save image',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  }

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit image</DialogTitle>
          <DialogDescription>Title and description show up in some templates.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input maxLength={80} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="altText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alt text</FormLabel>
                  <FormControl>
                    <Input maxLength={200} {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Describes the image for screen readers. Defaults to title if empty.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="folderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    >
                      <option value="">Unfiled</option>
                      {(folders.data ?? []).map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteImageConfirm({
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

function BulkDeleteConfirm({
  ids,
  images,
  portfolioId,
  onClose,
  onAllDeleted,
}: {
  ids: string[];
  images: PortfolioImage[];
  allImages: PortfolioImage[];
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

function MovePickerDialog({
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
          <DialogTitle>Move {count} image{count === 1 ? '' : 's'} to…</DialogTitle>
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
