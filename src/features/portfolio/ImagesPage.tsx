import { useMemo, useState } from 'react';
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
import type { ImageFolder, MediaItem, PortfolioImage } from '@/features/portfolio/types';
import { UploadPage } from './UploadPage';
import { ImageList } from './components/ImageList';
import { ImageEditDialog as EditDialog } from './components/ImageList/ImageEditDialog';
import { DeleteImageDialog as DeleteImageConfirm } from './components/ImageList/DeleteImageDialog';
import { type FolderSelection } from './components/FolderRail';
import { useViewMode, type ViewMode } from '../../hooks/useViewMode';
import { useImageSelection } from '@/hooks/useImageSelection';
import { DashboardLightboxToolbar } from './DashboardLightboxToolbar';
import {
  LightboxProvider,
  useLightboxState,
} from '@/features/public-showcase/lightbox/LightboxContext';
import { Lightbox } from '@/features/public-showcase/lightbox/Lightbox';
import { mediaKey } from '@/lib/queryKeys';
import { useFolders, useMedia, useReorderMedia, useUpdateImage } from '@/queries';
import { usePortfolioContext } from '@/context/PortfolioContext';

export function ImagesPage() {
  const qc = useQueryClient();
  const { portfolio } = usePortfolioContext();
  const { data: allMedia = [] } = useMedia(portfolio.id);
  const { data: folders = [] } = useFolders(portfolio.id);
  const reorderMedia = useReorderMedia(portfolio.id);
  const updateImage = useUpdateImage(portfolio.id);
  const [selected, setSelected] = useState<FolderSelection>('all');
  const [viewMode, setViewMode] = useViewMode();
  const [lightboxEditing, setLightboxEditing] = useState<PortfolioImage | null>(null);
  const [lightboxDeleting, setLightboxDeleting] = useState<PortfolioImage | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const allImages = useMemo(
    () => allMedia.filter((m): m is MediaItem & { mediaType: 'image' } => m.mediaType === 'image'),
    [allMedia],
  );

  const visibleImages = useMemo(() => {
    if (selected === 'all') return allImages;
    return allImages.filter((img) => img.folderId === selected);
  }, [allImages, selected]);

  const visibleIds = useMemo(() => visibleImages.map((img) => img.id), [visibleImages]);
  const { selection, toggleSelection, clearSelection, selectAll } = useImageSelection(visibleIds);

  if (!portfolio) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

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

    const reorderedImages = arrayMove(allImages, oldIdx, newIdx);

    // Merge reordered images back into the full media list (preserving video positions)
    let imageIdx = 0;
    const merged: MediaItem[] = [...allMedia]
      .sort((a, b) => a.position - b.position)
      .map((item) => {
        if (item.mediaType === 'image') {
          return { ...reorderedImages[imageIdx++], mediaType: 'image' as const };
        }
        return item;
      });

    reorderMedia.mutate(merged);
  }

  async function moveImagesToFolder(ids: string[], folderId: string | null) {
    if (ids.length === 0) return;
    qc.setQueryData<MediaItem[]>(mediaKey(portfolio.id), (prev) =>
      prev?.map((item) =>
        item.mediaType === 'image' && ids.includes(item.id) ? { ...item, folderId } : item,
      ),
    );
    const results = await Promise.allSettled(
      ids.map((id) => updateImage.mutateAsync({ id, patch: { folderId } })),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      qc.invalidateQueries({ queryKey: mediaKey(portfolio.id) });
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
          onSelectAll={selectAll}
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
