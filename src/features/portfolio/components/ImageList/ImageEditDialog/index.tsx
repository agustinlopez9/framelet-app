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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { PortfolioImage } from '@/features/portfolio/types';
import { useUpdateImage, useFolders } from '@/queries';
import { imageMetadataSchema, type ImageMetadataValues } from '@/features/portfolio/schemas';
import { toast } from '@/hooks/use-toast';
import { FolderSelect } from './FolderSelect';

interface ImageEditDialogProps {
  image: PortfolioImage;
  portfolioId: string;
  onClose: () => void;
}

export function ImageEditDialog({ image, portfolioId, onClose }: ImageEditDialogProps) {
  const update = useUpdateImage(portfolioId);
  const { data: folders = [] } = useFolders(portfolioId);
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
                    <FolderSelect value={field.value} folders={folders} onChange={field.onChange} />
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
