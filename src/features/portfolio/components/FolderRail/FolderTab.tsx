import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface FolderTabProps {
  dropId: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  active: boolean;
  onSelect: () => void;
  menu?: React.ReactNode;
}

export function FolderTab({ dropId, icon, label, count, active, onSelect, menu }: FolderTabProps) {
  const { setNodeRef, isOver } = useDroppable({ id: dropId });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group/tab flex h-9 max-w-[300px] shrink-0 items-center gap-2 rounded-md border px-3 text-sm transition-colors',
        active
          ? 'border-primary/40 bg-accent text-accent-foreground'
          : 'border-input bg-background text-foreground hover:bg-accent/50',
        isOver && 'ring-2 ring-primary',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 items-center gap-2 truncate text-left"
      >
        {icon}
        <span className="truncate">{label}</span>
        <span className="ml-1 shrink-0 text-sm font-semibold text-foreground/80">{count}</span>
      </button>
      {menu}
    </div>
  );
}
