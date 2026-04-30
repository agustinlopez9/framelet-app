import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import type { ImageFolder, PortfolioImage } from '@/types';
import { UploadPage } from './UploadPage';
import { DeleteImageConfirm, EditDialog, ImageList } from './ImageList';
import { type FolderSelection } from './FolderRail';
import { useViewMode, type ViewMode } from './useViewMode';
import { DashboardLightboxToolbar } from './DashboardLightboxToolbar';
import {
  LightboxProvider,
  useLightboxState,
} from '@/features/public-showcase/lightbox/LightboxContext';
import { Lightbox } from '@/features/public-showcase/lightbox/Lightbox';
import {
  imagesKey,
  useFolders,
  useImages,
  useMyPortfolio,
  useReorderImages,
  useUpdateImage,
} from './queries';

/**
 * Drop selection ids that are no longer visible. Returns the same Set
 * reference when nothing changed so the React state setter can short-circuit.
 */
export function reconcileSelection(prev: Set<string>, visibleIds: string[]): Set<string> {
  if (prev.size === 0) return prev;
  const visible = new Set(visibleIds);
  let changed = false;
  const next = new Set<string>();
  for (const id of prev) {
    if (visible.has(id)) next.add(id);
    else changed = true;
  }
  return changed ? next : prev;
}

export function ImagesPage() {
  const qc = useQueryClient();
  const { data: portfolio } = useMyPortfolio();
  const { data: allImages = [] } = useImages(portfolio?.id);
  const { data: folders = [] } = useFolders(portfolio?.id);
  const reorderImages = useReorderImages(portfolio?.id ?? '');
  const updateImage = useUpdateImage(portfolio?.id ?? '');
  const [selected, setSelected] = useState<FolderSelection>('all');
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useViewMode();
  // Lightbox-driven Edit/Delete dialogs live here so they sit above the
  // lightbox via Radix portals.
  const [lightboxEditing, setLightboxEditing] = useState<PortfolioImage | null>(null);
  const [lightboxDeleting, setLightboxDeleting] = useState<PortfolioImage | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const toggleSelection = useCallback((id: string) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelection(new Set()), []);

  const visibleImages = useMemo(() => {
    if (selected === 'all') return allImages;
    return allImages.filter((img) => img.folderId === selected);
  }, [allImages, selected]);

  useEffect(() => {
    setSelection((prev) => reconcileSelection(prev, visibleImages.map((img) => img.id)));
  }, [visibleImages]);

  if (!portfolio) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Folder reordering is intentionally not supported in this pass — folders
  // render as a horizontal tab strip whose order is API-determined. The drag
  // handler only moves images (across folders or within the active list).
  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);

    if (overId.startsWith('folder:')) {
      const target = overId.slice('folder:'.length);
      if (target === 'all') return;
      const activeId = String(active.id);
      const ids =
        selection.has(activeId) && selection.size > 0 ? Array.from(selection) : [activeId];
      void moveImagesToFolder(ids, target);
      return;
    }

    if (active.id === over.id) return;
    const oldIdx = allImages.findIndex((img) => img.id === active.id);
    const newIdx = allImages.findIndex((img) => img.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    reorderImages.mutate(arrayMove(allImages, oldIdx, newIdx));
  }

  async function moveImagesToFolder(ids: string[], folderId: string | null) {
    if (!portfolio || ids.length === 0) return;
    qc.setQueryData<PortfolioImage[]>(imagesKey(portfolio.id), (prev) =>
      prev?.map((img) => (ids.includes(img.id) ? { ...img, folderId } : img)),
    );
    const results = await Promise.allSettled(
      ids.map((id) => updateImage.mutateAsync({ id, patch: { folderId } })),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      qc.invalidateQueries({ queryKey: imagesKey(portfolio.id) });
      toast({
        title: `Could not move ${failed} image${failed === 1 ? '' : 's'}`,
        variant: 'destructive',
      });
    } else if (ids.length > 1) {
      toast({ title: `Moved ${ids.length} images` });
    }
    if (selection.size > 0) clearSelection();
  }

  return (
    <div className="space-y-6 pb-32">
      <UploadPage />
      <LightboxProvider images={visibleImages}>
        <ImagesPageInner
          portfolioId={portfolio.id}
          allImages={allImages}
          visibleImages={visibleImages}
          folders={folders}
          selected={selected}
          onSelectFolder={setSelected}
          selection={selection}
          onToggleSelection={toggleSelection}
          onClearSelection={clearSelection}
          onSelectAll={() => setSelection(new Set(visibleImages.map((img) => img.id)))}
          onMoveSelected={(folderId) => moveImagesToFolder(Array.from(selection), folderId)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sensors={sensors}
          onDragEnd={onDragEnd}
          onLightboxEdit={setLightboxEditing}
          onLightboxDelete={setLightboxDeleting}
        />
        {lightboxEditing ? (
          <EditDialog
            image={lightboxEditing}
            portfolioId={portfolio.id}
            onClose={() => setLightboxEditing(null)}
          />
        ) : null}
        {lightboxDeleting ? (
          <DeleteImageConfirm
            image={lightboxDeleting}
            portfolioId={portfolio.id}
            onClose={() => setLightboxDeleting(null)}
          />
        ) : null}
      </LightboxProvider>
    </div>
  );
}

interface ImagesPageInnerProps {
  portfolioId: string;
  allImages: PortfolioImage[];
  visibleImages: PortfolioImage[];
  folders: ImageFolder[];
  selected: FolderSelection;
  onSelectFolder: (next: FolderSelection) => void;
  selection: Set<string>;
  onToggleSelection: (id: string) => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onMoveSelected: (folderId: string | null) => void | Promise<void>;
  viewMode: ViewMode;
  onViewModeChange: (next: ViewMode) => void;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  onLightboxEdit: (image: PortfolioImage) => void;
  onLightboxDelete: (image: PortfolioImage) => void;
}

/**
 * Renders the dashboard image manager inside the LightboxProvider so the
 * "open viewer" callback can dispatch openAt directly through the context.
 */
function ImagesPageInner({
  portfolioId,
  allImages,
  visibleImages,
  folders,
  selected,
  onSelectFolder,
  selection,
  onToggleSelection,
  onClearSelection,
  onSelectAll,
  onMoveSelected,
  viewMode,
  onViewModeChange,
  sensors,
  onDragEnd,
  onLightboxEdit,
  onLightboxDelete,
}: ImagesPageInnerProps) {
  const lightbox = useLightboxState();
  const openViewer = (image: PortfolioImage) => {
    const idx = visibleImages.findIndex((i) => i.id === image.id);
    if (idx >= 0) lightbox?.openAt(idx);
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <ImageList
          portfolioId={portfolioId}
          images={visibleImages}
          allImages={allImages}
          folders={folders}
          selected={selected}
          onSelectFolder={onSelectFolder}
          selection={selection}
          onToggleSelection={onToggleSelection}
          onClearSelection={onClearSelection}
          onSelectAll={onSelectAll}
          onMoveSelected={onMoveSelected}
          onOpenViewer={openViewer}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          emptyHint={
            selected === 'all'
              ? 'No images yet. Upload some above.'
              : 'No images in this folder yet — drag some here from another view.'
          }
        />
      </DndContext>
      <Lightbox
        topToolbar={
          <DashboardLightboxToolbar onEdit={onLightboxEdit} onDelete={onLightboxDelete} />
        }
      />
    </>
  );
}
