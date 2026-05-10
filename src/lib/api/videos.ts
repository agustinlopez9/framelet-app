import { supabase } from '@/lib/supabase';
import type { Video } from '@/features/portfolio/types';
import type { UserPlan } from '@/types';
import { FREE_STORAGE_BYTES, PREMIUM_STORAGE_BYTES } from './images';

const BUCKET = 'portfolio-videos';
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

interface VideoRow {
  id: string;
  portfolio_id: string;
  storage_path: string;
  title: string;
  description: string;
  position: number;
  duration_seconds: number | null;
  thumbnail_path: string | null;
  file_size_bytes: number;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

function videoPublicUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function rowToVideo(row: VideoRow): Video {
  return {
    id: row.id,
    portfolioId: row.portfolio_id,
    storagePath: row.storage_path,
    url: videoPublicUrl(row.storage_path),
    title: row.title,
    description: row.description,
    position: row.position,
    durationSeconds: row.duration_seconds,
    thumbnailPath: row.thumbnail_path,
    fileSize: row.file_size_bytes,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class VideoValidationError extends Error {
  constructor(
    message: string,
    public readonly fileName: string,
  ) {
    super(message);
    this.name = 'VideoValidationError';
  }
}

export async function listVideos(portfolioId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('position', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as VideoRow[]).map(rowToVideo);
}

export interface UploadVideoOptions {
  ownerId: string;
  portfolioId: string;
  file: File;
  title?: string;
  plan?: UserPlan;
  currentStorageBytes?: number;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

function extensionFor(file: File): string {
  if (file.type === 'video/mp4') return 'mp4';
  if (file.type === 'video/webm') return 'webm';
  if (file.type === 'video/quicktime') return 'mov';
  return 'bin';
}

export async function uploadVideo(opts: UploadVideoOptions): Promise<Video> {
  if (!(ACCEPTED_VIDEO_TYPES as readonly string[]).includes(opts.file.type)) {
    throw new VideoValidationError(
      `Unsupported video type ${opts.file.type || 'unknown'}. Use MP4, WebM, or MOV.`,
      opts.file.name,
    );
  }
  if (opts.file.size > MAX_VIDEO_BYTES) {
    throw new VideoValidationError(
      `File is ${(opts.file.size / 1024 / 1024).toFixed(0)}MB; the limit is 500MB.`,
      opts.file.name,
    );
  }

  if (opts.plan !== undefined && opts.currentStorageBytes !== undefined) {
    const limit = opts.plan === 'premium' ? PREMIUM_STORAGE_BYTES : FREE_STORAGE_BYTES;
    if (opts.currentStorageBytes + opts.file.size > limit) {
      throw new VideoValidationError('Storage quota exceeded.', opts.file.name);
    }
  }

  const videoId = crypto.randomUUID();
  const path = `${opts.ownerId}/${opts.portfolioId}/${videoId}.${extensionFor(opts.file)}`;

  if (opts.onProgress) {
    await uploadWithProgress(path, opts.file, opts.onProgress, opts.signal);
  } else {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, opts.file, { contentType: opts.file.type, upsert: false });
    if (error) throw new Error(error.message);
  }

  const { data: posDataImg } = await supabase
    .from('images')
    .select('position')
    .eq('portfolio_id', opts.portfolioId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();
  const { data: posDataVid } = await supabase
    .from('videos')
    .select('position')
    .eq('portfolio_id', opts.portfolioId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();
  const nextPosition = Math.max(posDataImg?.position ?? -1, posDataVid?.position ?? -1) + 1;

  const title =
    opts.title ??
    (() => {
      const lastDot = opts.file.name.lastIndexOf('.');
      const base = lastDot > 0 ? opts.file.name.slice(0, lastDot) : opts.file.name;
      return base.replace(/[_-]+/g, ' ').trim();
    })();

  const { data, error } = await supabase
    .from('videos')
    .insert({
      id: videoId,
      portfolio_id: opts.portfolioId,
      storage_path: path,
      position: nextPosition,
      title,
      file_size_bytes: opts.file.size,
    })
    .select('*')
    .single<VideoRow>();

  if (error || !data) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(error?.message ?? 'Failed to record video');
  }
  return rowToVideo(data);
}

async function uploadWithProgress(
  path: string,
  file: File,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const { data: signed, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !signed) throw new Error(error?.message ?? 'Failed to create upload URL');

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signed.signedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Upload failed (network error)'));
    xhr.onabort = () => reject(new DOMException('Upload aborted', 'AbortError'));
    if (signal) {
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }
    xhr.send(file);
  });
}

export interface UpdateVideoInput {
  title?: string;
  description?: string;
}

export async function updateVideo(id: string, patch: UpdateVideoInput): Promise<Video> {
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description;
  const { data, error } = await supabase
    .from('videos')
    .update(update)
    .eq('id', id)
    .select('*')
    .single<VideoRow>();
  if (error || !data) throw new Error(error?.message ?? 'Failed to update video');
  return rowToVideo(data);
}

export async function deleteVideo(video: Video): Promise<void> {
  const { error: storageErr } = await supabase.storage.from(BUCKET).remove([video.storagePath]);
  if (storageErr) throw new Error(storageErr.message);
  const { error: dbErr } = await supabase.from('videos').delete().eq('id', video.id);
  if (dbErr) throw new Error(dbErr.message);
}
