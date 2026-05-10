import type { ImageFolder } from '@/features/portfolio/types';

interface FolderSelectProps {
  value: string | null;
  folders: ImageFolder[];
  onChange: (value: string | null) => void;
}

export function FolderSelect({ value, folders, onChange }: FolderSelectProps) {
  return (
    <select
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">Unfiled</option>
      {folders.map((folder) => (
        <option key={folder.id} value={folder.id}>
          {folder.name}
        </option>
      ))}
    </select>
  );
}
