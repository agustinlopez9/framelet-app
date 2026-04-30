import { useCallback, useMemo, useState } from 'react';
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
import type { PortfolioImage } from '@/types';
import { UploadPage } from './UploadPage';
import { ImageList } from './ImageList';
import { FolderRail, type FolderSelection } from './FolderRail';
import {
  imagesKey,
  useFolders,
  useImages,
  useMyPortfolio,
  useReorderFolders,
  useReorderImages,
  useUpdateImage,
} from './queries';

export function ImagesPage() {
  const qc = useQueryClient();
  const { data: portfolio } = useMyPortfolio();
  const { data: allImages = [] } = useImages(portfolio?.id);
  const { data: folders = [] } = useFolders(portfolio?.id);
  const reorderImages = useReorderImages(portfolio?.id ?? '');
  const reorderFolders = useReorderFolders(portfolio?.id ?? '');
  const updateImage = useUpdateImage(portfolio?.id ?? '');
  const [selected, setSelected] = useState<FolderSelection>('all');
  const [selection, setSelection] = useState<Set<string>>(new Set());
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
    const activeType = active.data.current?.type;
    const overId = String(over.id);

    if (activeType === 'folder') {
      if (active.id === over.id) return;
      const oldIdx = folders.findIndex((f) => f.id === active.id);
      const newIdx = folders.findIndex((f) => f.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;
      reorderFolders.mutate(arrayMove(folders, oldIdx, newIdx));
      return;
    }

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
    <div className="space-y-6">
      <UploadPage />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
          <FolderRail
            portfolioId={portfolio.id}
            folders={folders}
            images={allImages}
            selected={selected}
            onSelect={setSelected}
          />
          <ImageList
            portfolioId={portfolio.id}
            images={visibleImages}
            folders={folders}
            selected={selected}
            selection={selection}
            onToggleSelection={toggleSelection}
            onClearSelection={clearSelection}
            onSelectAll={() => setSelection(new Set(visibleImages.map((img) => img.id)))}
            onMoveSelected={(folderId) => moveImagesToFolder(Array.from(selection), folderId)}
            emptyHint={
              selected === 'all'
                ? 'No images yet. Upload some above.'
                : 'No images in this folder yet — drag some here from another view.'
            }
          />
        </div>
      </DndContext>
    </div>
  );
}
