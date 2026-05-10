import { useState } from 'react';
import { FolderClosed, Images, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ImageFolder, PortfolioImage } from '@/features/portfolio/types';
import { FolderTab } from './FolderTab';
import { CreateFolderDialog } from './CreateFolderDialog';
import { RenameFolderDialog } from './RenameFolderDialog';
import { DeleteFolderDialog } from './DeleteFolderDialog';

export type FolderSelection = 'all' | string;

interface FolderRailProps {
  portfolioId: string;
  folders: ImageFolder[];
  images: PortfolioImage[];
  selected: FolderSelection;
  onSelect: (next: FolderSelection) => void;
}

export function FolderRail({ portfolioId, folders, images, selected, onSelect }: FolderRailProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<ImageFolder | null>(null);
  const [renaming, setRenaming] = useState<ImageFolder | null>(null);

  const allCount = images.length;
  const folderCounts = new Map<string, number>();
  for (const img of images) {
    if (img.folderId) folderCounts.set(img.folderId, (folderCounts.get(img.folderId) ?? 0) + 1);
  }

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <FolderTab
          dropId="folder:all"
          icon={<Images className="h-4 w-4 shrink-0" />}
          label="All images"
          count={allCount}
          active={selected === 'all'}
          onSelect={() => onSelect('all')}
        />
        {folders.map((folder) => (
          <FolderTab
            key={folder.id}
            dropId={`folder:${folder.id}`}
            icon={<FolderClosed className="h-4 w-4 shrink-0" />}
            label={folder.name}
            count={folderCounts.get(folder.id) ?? 0}
            active={selected === folder.id}
            onSelect={() => onSelect(folder.id)}
            menu={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label={`Folder actions for ${folder.name}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-base leading-none">⋮</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setRenaming(folder)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setDeleting(folder)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        ))}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setCreateOpen(true)}
          aria-label="Create folder"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {createOpen ? (
        <CreateFolderDialog portfolioId={portfolioId} onClose={() => setCreateOpen(false)} />
      ) : null}
      {renaming ? (
        <RenameFolderDialog
          folder={renaming}
          portfolioId={portfolioId}
          onClose={() => setRenaming(null)}
        />
      ) : null}
      {deleting ? (
        <DeleteFolderDialog
          folder={deleting}
          portfolioId={portfolioId}
          imageCount={folderCounts.get(deleting.id) ?? 0}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            if (selected === deleting.id) onSelect('all');
          }}
        />
      ) : null}
    </>
  );
}
