import { Pencil, Trash2 } from 'lucide-react';
import { useLightboxState } from '@/features/public-showcase/lightbox/LightboxContext';
import type { PortfolioImage } from '@/types';

interface DashboardLightboxToolbarProps {
  onEdit: (image: PortfolioImage) => void;
  onDelete: (image: PortfolioImage) => void;
}

/**
 * Top-toolbar slot for the dashboard's reuse of the public Lightbox. Renders
 * Edit + Delete buttons that operate on whichever image is currently active
 * in the lightbox state. Both callbacks are expected to open the existing
 * dialogs (EditDialog / DeleteImageConfirm) at the page level.
 */
export function DashboardLightboxToolbar({ onEdit, onDelete }: DashboardLightboxToolbarProps) {
  const ctx = useLightboxState();
  const image = ctx?.state.images[ctx?.state.activeIndex ?? -1];
  if (!image) return null;
  return (
    <>
      <button
        type="button"
        aria-label="Edit image"
        onClick={() => onEdit(image)}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium backdrop-blur transition hover:bg-white/20"
      >
        <Pencil className="h-4 w-4" aria-hidden />
        Edit
      </button>
      <button
        type="button"
        aria-label="Delete image"
        onClick={() => onDelete(image)}
        className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-100 backdrop-blur transition hover:bg-red-500/30"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        Delete
      </button>
    </>
  );
}
