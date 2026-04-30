import { supabase } from '@/lib/supabase';
import type { ImageFolder } from '@/types';

interface FolderRow {
  id: string;
  portfolio_id: string;
  name: string;
  position: number;
  hidden: boolean;
  created_at: string;
}

function rowToFolder(row: FolderRow): ImageFolder {
  return {
    id: row.id,
    portfolioId: row.portfolio_id,
    name: row.name,
    position: row.position,
    hidden: row.hidden,
    createdAt: row.created_at,
  };
}

export async function listFolders(portfolioId: string): Promise<ImageFolder[]> {
  const { data, error } = await supabase
    .from('image_folders')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('position', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as FolderRow[]).map(rowToFolder);
}

export interface CreateFolderInput {
  name: string;
  hidden?: boolean;
}

export async function createFolder(
  portfolioId: string,
  input: CreateFolderInput,
): Promise<ImageFolder> {
  const trimmed = input.name.trim();
  if (!trimmed) throw new Error('Folder name cannot be empty.');

  const { data: posData } = await supabase
    .from('image_folders')
    .select('position')
    .eq('portfolio_id', portfolioId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();
  const nextPosition = (posData?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from('image_folders')
    .insert({
      portfolio_id: portfolioId,
      name: trimmed,
      position: nextPosition,
      hidden: input.hidden ?? false,
    })
    .select('*')
    .single<FolderRow>();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create folder');
  return rowToFolder(data);
}

export async function renameFolder(id: string, name: string): Promise<ImageFolder> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Folder name cannot be empty.');

  const { data, error } = await supabase
    .from('image_folders')
    .update({ name: trimmed })
    .eq('id', id)
    .select('*')
    .single<FolderRow>();
  if (error || !data) throw new Error(error?.message ?? 'Failed to rename folder');
  return rowToFolder(data);
}

export async function reorderFolders(ordered: ImageFolder[]): Promise<void> {
  const updates = ordered.map((folder, idx) =>
    supabase.from('image_folders').update({ position: idx }).eq('id', folder.id),
  );
  const results = await Promise.all(updates);
  for (const r of results) {
    if (r.error) throw new Error(r.error.message);
  }
}

export async function setFolderHidden(id: string, hidden: boolean): Promise<ImageFolder> {
  const { data, error } = await supabase
    .from('image_folders')
    .update({ hidden })
    .eq('id', id)
    .select('*')
    .single<FolderRow>();
  if (error || !data) throw new Error(error?.message ?? 'Failed to update folder');
  return rowToFolder(data);
}

export async function deleteFolder(id: string): Promise<void> {
  const { error } = await supabase.from('image_folders').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
