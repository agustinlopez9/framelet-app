import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, Video, X } from 'lucide-react';

export interface UploadQueueItem {
  id: string;
  file: File;
  title: string;
  kind: 'image' | 'video';
  status: 'pending' | 'uploading' | 'done' | 'error' | 'invalid';
  progress: number;
  error?: string;
  controller?: AbortController;
}

function statusLabel(item: UploadQueueItem): string {
  switch (item.status) {
    case 'pending':
      return 'Ready to upload';
    case 'uploading':
      return `${item.progress}%`;
    case 'done':
      return 'Done';
    case 'error':
      return 'Failed';
    case 'invalid':
      return 'Invalid';
  }
}

interface QueueItemProps {
  item: UploadQueueItem;
  onUpload: (id: string) => void;
  onRemove: (id: string) => void;
}

export function QueueItem({ item, onUpload, onRemove }: QueueItemProps) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {item.status === 'done' ? (
            <Check className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          ) : item.kind === 'video' ? (
            <Video className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(item.file.size / 1024 / 1024).toFixed(2)}MB · {statusLabel(item)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.status === 'pending' ? (
            <Button size="sm" variant="outline" onClick={() => onUpload(item.id)}>
              Upload
            </Button>
          ) : null}
          {item.status === 'error' ? (
            <Button size="sm" variant="outline" onClick={() => onUpload(item.id)}>
              Retry
            </Button>
          ) : null}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onRemove(item.id)}
            aria-label={item.status === 'uploading' ? 'Cancel upload' : 'Remove from queue'}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {item.status === 'uploading' ? <Progress value={item.progress} className="mt-3" /> : null}
      {item.error ? <p className="mt-2 text-xs text-destructive">{item.error}</p> : null}
    </div>
  );
}
