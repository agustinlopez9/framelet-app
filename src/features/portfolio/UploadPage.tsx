import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { usePortfolioContext } from '@/context/PortfolioContext';
import {
  MAX_IMAGE_BYTES,
  UploadValidationError,
  deriveTitleFromFilename,
  uploadImage,
  validateFile,
} from '@/lib/api/images';
import {
  ACCEPTED_VIDEO_TYPES,
  MAX_VIDEO_BYTES,
  VideoValidationError,
  uploadVideo,
} from '@/lib/api/videos';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { imagesKey, mediaKey, userKey } from '@/lib/queryKeys';
import { useMyUser } from '@/queries';
import { QueueItem, type UploadQueueItem } from './components/UploadPage/QueueItem';

export function UploadPage() {
  const { portfolio, plan } = usePortfolioContext();
  const { data: user } = useMyUser();
  const qc = useQueryClient();
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const queueRef = useRef(queue);
  // eslint-disable-next-line react-hooks/refs
  queueRef.current = queue;

  const onDrop = useCallback(
    (files: File[]) => {
      const next: UploadQueueItem[] = files.map((file) => {
        const id = crypto.randomUUID();
        const title = deriveTitleFromFilename(file.name);
        const isVideo = (ACCEPTED_VIDEO_TYPES as readonly string[]).includes(file.type);
        const kind = isVideo ? 'video' : 'image';

        if (isVideo && plan !== 'premium') {
          return {
            id,
            file,
            title,
            kind,
            status: 'invalid',
            progress: 0,
            error: 'Video uploads require a Premium account.',
          };
        }

        try {
          if (kind === 'image') validateFile(file);
          else if (file.size > MAX_VIDEO_BYTES) {
            throw new VideoValidationError(
              `File is ${(file.size / 1024 / 1024).toFixed(0)}MB; the limit is 500MB.`,
              file.name,
            );
          }
          return { id, file, title, kind, status: 'pending', progress: 0 };
        } catch (err) {
          return {
            id,
            file,
            title,
            kind,
            status: 'invalid',
            progress: 0,
            error:
              err instanceof UploadValidationError || err instanceof VideoValidationError
                ? err.message
                : 'Invalid file.',
          };
        }
      });
      setQueue((prev) => [...prev, ...next]);
    },
    [plan],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      ...(plan === 'premium'
        ? { 'video/mp4': ['.mp4'], 'video/webm': ['.webm'], 'video/quicktime': ['.mov'] }
        : {}),
    },
    maxSize: plan === 'premium' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES,
  });

  function updateItem(id: string, patch: Partial<UploadQueueItem>) {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    const item = queueRef.current.find((q) => q.id === id);
    item?.controller?.abort();
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }

  async function startUpload(id: string) {
    const item = queueRef.current.find((q) => q.id === id);
    if (!item || item.status !== 'pending') return;
    const controller = new AbortController();
    updateItem(id, { status: 'uploading', controller, progress: 0, error: undefined });
    try {
      if (item.kind === 'image') {
        await uploadImage({
          ownerId: portfolio.ownerId,
          portfolioId: portfolio.id,
          file: item.file,
          title: item.title,
          plan,
          currentStorageBytes: user?.storageUsedBytes,
          onProgress: (fraction) => updateItem(id, { progress: Math.round(fraction * 100) }),
          signal: controller.signal,
        });
        qc.invalidateQueries({ queryKey: imagesKey(portfolio.id) });
      } else {
        await uploadVideo({
          ownerId: portfolio.ownerId,
          portfolioId: portfolio.id,
          file: item.file,
          title: item.title,
          plan,
          currentStorageBytes: user?.storageUsedBytes,
          onProgress: (fraction) => updateItem(id, { progress: Math.round(fraction * 100) }),
          signal: controller.signal,
        });
      }
      updateItem(id, { status: 'done', progress: 100 });
      qc.invalidateQueries({ queryKey: mediaKey(portfolio.id) });
      qc.invalidateQueries({ queryKey: userKey });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      updateItem(id, {
        status: err instanceof DOMException && err.name === 'AbortError' ? 'pending' : 'error',
        error: err instanceof DOMException && err.name === 'AbortError' ? undefined : message,
      });
    }
  }

  async function startAll() {
    const pending = queueRef.current.filter((q) => q.status === 'pending');
    for (const item of pending) await startUpload(item.id);
    if (pending.length > 0) toast({ title: `Uploaded ${pending.length} file(s)` });
  }

  const hasClearable = queue.some((q) => q.status !== 'uploading');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload media</CardTitle>
          <CardDescription>
            {plan === 'premium'
              ? 'JPEG, PNG, WebP up to 10MB · MP4, WebM, MOV up to 500MB.'
              : 'JPEG, PNG, or WebP. Max 10MB per file.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps({
              className: `flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${
                isDragActive ? 'border-primary bg-accent' : 'border-input'
              }`,
            })}
          >
            <input {...getInputProps()} aria-label="Choose files to upload" />
            <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm">
              {isDragActive ? 'Drop your files here…' : 'Drag files here, or click to select.'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Images (JPEG, PNG, WebP) up to 10MB
              {plan === 'premium' ? ' · Videos (MP4, WebM, MOV) up to 500MB' : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {queue.length > 0 ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Queue ({queue.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setQueue((prev) => prev.filter((q) => q.status === 'uploading'))}
                disabled={!hasClearable}
              >
                Clear list
              </Button>
              <Button onClick={startAll} disabled={!queue.some((q) => q.status === 'pending')}>
                Upload all
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.map((item) => (
              <QueueItem key={item.id} item={item} onUpload={startUpload} onRemove={removeItem} />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
