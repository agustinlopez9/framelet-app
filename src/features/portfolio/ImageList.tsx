import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Trash2, Pencil, GripVertical } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { PortfolioImage } from '@/types';
import {
  useDeleteImage,
  useImages,
  useMyPortfolio,
  useReorderImages,
  useUpdateImage,
} from './queries';
import { imageMetadataSchema, type ImageMetadataValues } from './schemas';
import { toast } from '@/hooks/use-toast';

export function ImageList() {
  const { data: portfolio } = useMyPortfolio();
  const { data: images } = useImages(portfolio?.id);
  const reorder = useReorderImages(portfolio?.id ?? '');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [editing, setEditing] = useState<PortfolioImage | null>(null);
  const [deleting, setDeleting] = useState<PortfolioImage | null>(null);

  if (!portfolio || !images) return null;

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !images) return;
    const oldIdx = images.findIndex((img) => img.id === active.id);
    const newIdx = images.findIndex((img) => img.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const next = arrayMove(images, oldIdx, newIdx);
    reorder.mutate(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your images ({images.length})</CardTitle>
        <CardDescription>Drag to reorder. Click an image to edit or delete it.</CardDescription>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground">No images yet. Head to Upload to add some.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {images.map((image) => (
                  <SortableImage
                    key={image.id}
                    image={image}
                    onEdit={() => setEditing(image)}
                    onDelete={() => setDeleting(image)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      {editing ? (
        <EditDialog
          image={editing}
          portfolioId={portfolio.id}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {deleting ? (
        <DeleteDialog
          image={deleting}
          portfolioId={portfolio.id}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </Card>
  );
}

function SortableImage({
  image,
  onEdit,
  onDelete,
}: {
  image: PortfolioImage;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative overflow-hidden rounded-md border">
      <img
        src={image.url}
        alt={image.altText || image.title || 'Portfolio image'}
        className="aspect-square w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/0 via-black/0 to-black/60 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="m-2 self-end rounded bg-black/50 p-1 text-white"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex items-center justify-between gap-2 p-2">
          <Button size="icon" variant="secondary" onClick={onEdit} aria-label="Edit image">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="destructive" onClick={onDelete} aria-label="Delete image">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditDialog({
  image,
  portfolioId,
  onClose,
}: {
  image: PortfolioImage;
  portfolioId: string;
  onClose: () => void;
}) {
  const update = useUpdateImage(portfolioId);
  const form = useForm<ImageMetadataValues>({
    resolver: zodResolver(imageMetadataSchema),
    defaultValues: {
      title: image.title,
      description: image.description,
      altText: image.altText,
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

function DeleteDialog({
  image,
  portfolioId,
  onClose,
}: {
  image: PortfolioImage;
  portfolioId: string;
  onClose: () => void;
}) {
  const del = useDeleteImage(portfolioId);

  async function onConfirm() {
    try {
      await del.mutateAsync(image);
      toast({ title: 'Image deleted' });
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
    <Dialog open onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this image?</DialogTitle>
          <DialogDescription>This permanently removes the file. There&apos;s no undo.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={del.isPending}>
            {del.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
