import { Button } from '@/components/ui/button';
import { FolderInput, Trash2, X } from 'lucide-react';

interface SelectionToolbarProps {
  count: number;
  allInViewSelected: boolean;
  onSelectAll: () => void;
  onMove: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function SelectionToolbar({
  count,
  allInViewSelected,
  onSelectAll,
  onMove,
  onDelete,
  onClear,
}: SelectionToolbarProps) {
  return (
    <div className="sticky top-2 z-10 mb-4 flex items-center gap-2 rounded-md border bg-card/95 px-2 py-1 shadow-sm backdrop-blur">
      <span className="text-sm text-muted-foreground">{count} selected</span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 text-xs"
        onClick={allInViewSelected ? onClear : onSelectAll}
      >
        {allInViewSelected ? 'Deselect all' : 'Select all'}
      </Button>
      <div className="ml-auto flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-7 w-7"
          onClick={onMove}
          aria-label="Move selected to folder"
        >
          <FolderInput className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="h-7 w-7"
          onClick={onDelete}
          aria-label="Delete selected"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onClear}
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
