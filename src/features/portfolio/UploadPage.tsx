import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useMyPortfolio } from './queries';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  UploadValidationError,
  uploadImage,
  validateFile,
} from '@/lib/api/images';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { imagesKey } from './queries';
import { Upload, X } from 'lucide-react';

interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error' | 'invalid';
  progress: number;
  error?: string;
  controller?: AbortController;
}

export function UploadPage() {
  const { data: portfolio } = useMyPortfolio();
  const qc = useQueryClient();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const onDrop = useCallback((files: File[]) => {
    const next: QueueItem[] = files.map((file) => {
      const id = crypto.randomUUID();
      try {
        validateFile(file);
        return { id, file, status: 'pending', progress: 0 };
      } catch (err) {
        return {
          id,
          file,
          status: 'invalid',
          progress: 0,
          error: err instanceof UploadValidationError ? err.message : 'Invalid file.',
        };
      }
    });
    setQueue((prev) => [...prev, ...next]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxSize: MAX_IMAGE_BYTES,
  });

  function updateItem(id: string, patch: Partial<QueueItem>) {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    const item = queueRef.current.find((q) => q.id === id);
    item?.controller?.abort();
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }

  async function startUpload(id: string) {
    if (!portfolio) return;
    const item = queueRef.current.find((q) => q.id === id);
    if (!item || item.status !== 'pending') return;
    const controller = new AbortController();
    updateItem(id, { status: 'uploading', controller, progress: 0, error: undefined });
    try {
      await uploadImage({
        ownerId: portfolio.ownerId,
        portfolioId: portfolio.id,
        file: item.file,
        onProgress: (fraction) => updateItem(id, { progress: Math.round(fraction * 100) }),
        signal: controller.signal,
      });
      updateItem(id, { status: 'done', progress: 100 });
      qc.invalidateQueries({ queryKey: imagesKey(portfolio.id) });
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
    for (const item of pending) {
      await startUpload(item.id);
    }
    if (pending.length > 0) toast({ title: `Uploaded ${pending.length} image(s)` });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload images</CardTitle>
          <CardDescription>JPEG, PNG, or WebP. Max 10MB per file.</CardDescription>
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
              {isDragActive ? 'Drop your images here…' : 'Drag images here, or click to select.'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {ACCEPTED_IMAGE_TYPES.join(', ')} · up to 10MB
            </p>
          </div>
        </CardContent>
      </Card>

      {queue.length > 0 ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Queue ({queue.length})</CardTitle>
            <Button onClick={startAll} disabled={!queue.some((q) => q.status === 'pending')}>
              Upload all
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(item.file.size / 1024 / 1024).toFixed(2)}MB · {statusLabel(item)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'pending' ? (
                      <Button size="sm" variant="outline" onClick={() => startUpload(item.id)}>
                        Upload
                      </Button>
                    ) : null}
                    {item.status === 'error' ? (
                      <Button size="sm" variant="outline" onClick={() => startUpload(item.id)}>
                        Retry
                      </Button>
                    ) : null}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                      aria-label={item.status === 'uploading' ? 'Cancel upload' : 'Remove from queue'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {item.status === 'uploading' ? (
                  <Progress value={item.progress} className="mt-3" />
                ) : null}
                {item.error ? (
                  <p className="mt-2 text-xs text-destructive">{item.error}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function statusLabel(item: QueueItem): string {
  switch (item.status) {
    case 'pending':
      return 'Ready to upload';
    case 'uploading':
      return `${item.progress}%`;
    case 'done':
      return 'Uploaded';
    case 'error':
      return 'Failed';
    case 'invalid':
      return 'Invalid';
  }
}
