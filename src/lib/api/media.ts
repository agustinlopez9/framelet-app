import { supabase } from '@/lib/supabase';
import type { MediaItem } from '@/types';
import { listImages } from './images';
import { listVideos } from './videos';

export async function listMedia(portfolioId: string): Promise<MediaItem[]> {
  const [images, videos] = await Promise.all([
    listImages(portfolioId),
    listVideos(portfolioId),
  ]);

  const imageItems: MediaItem[] = images.map((img) => ({ ...img, mediaType: 'image' as const }));
  const videoItems: MediaItem[] = videos.map((vid) => ({ ...vid, mediaType: 'video' as const }));

  return [...imageItems, ...videoItems].sort((a, b) => a.position - b.position);
}

export async function reorderMedia(items: MediaItem[], portfolioId: string): Promise<void> {
  const imageItems = items.filter((i): i is MediaItem & { mediaType: 'image' } => i.mediaType === 'image');
  const videoItems = items.filter((i): i is MediaItem & { mediaType: 'video' } => i.mediaType === 'video');

  const image_ids = imageItems.map((i) => i.id);
  const video_ids = videoItems.map((v) => v.id);
  const image_positions = imageItems.map((i) => items.findIndex((item) => item.id === i.id && item.mediaType === 'image'));
  const video_positions = videoItems.map((v) => items.findIndex((item) => item.id === v.id && item.mediaType === 'video'));

  const { error } = await supabase.rpc('reorder_media', {
    image_ids,
    video_ids,
    image_positions,
    video_positions,
    portfolio_id_in: portfolioId,
  });
  if (error) throw new Error(error.message);
}
