import { useState } from 'react';
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List as ListIcon } from 'lucide-react';
import type { ImageFolder, PortfolioImage } from '@/features/portfolio/types';
import type { ViewMode } from '@/hooks/useViewMode';
import type { FolderSelection } from '@/features/portfolio/components/FolderRail';
import { FolderRail } from '@/features/portfolio/components/FolderRail';
import { ImageGridItem, ImageListItem } from './ImageListItem';
import { SelectionToolbar } from '@/features/portfolio/components/ImageList/SelectionToolbar';
import { ImageEditDialog } from './ImageEditDialog';
import { DeleteImageDialog, BulkDeleteDialog, MovePickerDialog } from './DeleteImageDialog';

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
          <SelectionToolbar
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
                <ImageGridItem
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
                <ImageListItem
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
        <ImageEditDialog
          image={editing}
          portfolioId={portfolioId}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {deleting ? (
        <DeleteImageDialog
          image={deleting}
          portfolioId={portfolioId}
          onClose={() => setDeleting(null)}
        />
      ) : null}
      {bulkDeleteOpen ? (
        <BulkDeleteDialog
          ids={Array.from(selection)}
          images={images.filter((img) => selection.has(img.id))}
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
