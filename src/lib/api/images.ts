import { supabase } from '@/lib/supabase';
import type { PortfolioImage } from '@/types';

const BUCKET = 'portfolio-images';
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

interface ImageRow {
  id: string;
  portfolio_id: string;
  storage_path: string;
  title: string;
  description: string;
  alt_text: string;
  position: number;
  width: number | null;
  height: number | null;
  folder_id: string | null;
  created_at: string;
}

function publicUrlFor(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function rowToImage(row: ImageRow): PortfolioImage {
  return {
    id: row.id,
    portfolioId: row.portfolio_id,
    storagePath: row.storage_path,
    url: publicUrlFor(row.storage_path),
    title: row.title,
    description: row.description,
    altText: row.alt_text,
    position: row.position,
    width: row.width,
    height: row.height,
    folderId: row.folder_id ?? null,
    createdAt: row.created_at,
  };
}

export async function listImages(portfolioId: string): Promise<PortfolioImage[]> {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('position', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ImageRow[]).map(rowToImage);
}

export interface UploadImageOptions {
  ownerId: string;
  portfolioId: string;
  file: File;
  title?: string;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

export function deriveTitleFromFilename(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  const base = lastDot > 0 ? filename.slice(0, lastDot) : filename;
  return base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export class UploadValidationError extends Error {
  constructor(
    message: string,
    public readonly fileName: string,
  ) {
    super(message);
    this.name = 'UploadValidationError';
  }
}

export function validateFile(file: File): void {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new UploadValidationError(
      `Unsupported file type ${file.type || 'unknown'}. Use JPEG, PNG, or WebP.`,
      file.name,
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadValidationError(
      `File is ${(file.size / 1024 / 1024).toFixed(1)}MB; the limit is 10MB.`,
      file.name,
    );
  }
}

function extensionFor(file: File): string {
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'bin';
}

export async function uploadImage(opts: UploadImageOptions): Promise<PortfolioImage> {
  validateFile(opts.file);

  const imageId = crypto.randomUUID();
  const path = `${opts.ownerId}/${opts.portfolioId}/${imageId}.${extensionFor(opts.file)}`;

  // Supabase JS client doesn't expose progress, so we PUT directly via fetch
  // using a signed upload URL when a progress callback is provided.
  if (opts.onProgress) {
    await uploadWithProgress(path, opts.file, opts.onProgress, opts.signal);
  } else {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, opts.file, { contentType: opts.file.type, upsert: false });
    if (error) throw new Error(error.message);
  }

  const { data: posData } = await supabase
    .from('images')
    .select('position')
    .eq('portfolio_id', opts.portfolioId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();
  const nextPosition = (posData?.position ?? -1) + 1;

  const title = opts.title ?? deriveTitleFromFilename(opts.file.name);
  const { data, error } = await supabase
    .from('images')
    .insert({
      id: imageId,
      portfolio_id: opts.portfolioId,
      storage_path: path,
      position: nextPosition,
      title,
    })
    .select('*')
    .single<ImageRow>();
  if (error || !data) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(error?.message ?? 'Failed to record image');
  }
  return rowToImage(data);
}

async function uploadWithProgress(
  path: string,
  file: File,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const { data: signed, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);
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

export interface UpdateImageInput {
  title?: string;
  description?: string;
  altText?: string;
  folderId?: string | null;
}

export async function updateImage(id: string, patch: UpdateImageInput): Promise<PortfolioImage> {
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.altText !== undefined) update.alt_text = patch.altText;
  if (patch.folderId !== undefined) update.folder_id = patch.folderId;
  const { data, error } = await supabase
    .from('images')
    .update(update)
    .eq('id', id)
    .select('*')
    .single<ImageRow>();
  if (error || !data) throw new Error(error?.message ?? 'Failed to update image');
  return rowToImage(data);
}

export async function assignImageFolder(
  imageId: string,
  folderId: string | null,
): Promise<PortfolioImage> {
  return updateImage(imageId, { folderId });
}

export async function deleteImage(image: PortfolioImage): Promise<void> {
  const { error: dbErr } = await supabase.from('images').delete().eq('id', image.id);
  if (dbErr) throw new Error(dbErr.message);
  await supabase.storage.from(BUCKET).remove([image.storagePath]);
}

export async function reorderImages(ordered: PortfolioImage[]): Promise<void> {
  const updates = ordered.map((img, idx) =>
    supabase.from('images').update({ position: idx }).eq('id', img.id),
  );
  const results = await Promise.all(updates);
  for (const r of results) {
    if (r.error) throw new Error(r.error.message);
  }
}
