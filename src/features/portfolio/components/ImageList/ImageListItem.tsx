import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Trash2, Pencil, GripVertical, Eye, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PortfolioImage } from '@/features/portfolio/types';

interface ItemActions {
  selected: boolean;
  onToggleSelection: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

export function ImageGridItem({
  image,
  selectionActive,
  selected,
  onToggleSelection,
  onEdit,
  onDelete,
  onView,
}: { image: PortfolioImage; selectionActive: boolean } & ItemActions) {
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

export function ImageListItem({
  image,
  folderName,
  showFolderSubtitle,
  selected,
  onToggleSelection,
  onEdit,
  onDelete,
  onView,
}: { image: PortfolioImage; folderName?: string; showFolderSubtitle: boolean } & ItemActions) {
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
      className={cn('flex items-center gap-3 px-3 py-2', selected && 'bg-accent/40')}
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
          <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
