import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserPlan } from '@/types';

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  premiumOnly?: boolean;
}

interface TemplateCardProps {
  template: Template;
  active: boolean;
  previewing: boolean;
  plan: UserPlan;
  onSelect: () => void;
}

export function TemplateCard({ template, active, previewing, plan, onSelect }: TemplateCardProps) {
  const locked = template.premiumOnly === true && plan === 'free';

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={locked}
      className={cn(
        'group relative flex flex-col rounded-lg border bg-card p-4 text-left transition-all',
        locked ? 'cursor-not-allowed opacity-60' : 'hover:border-primary/40',
        previewing && !locked ? 'border-primary ring-2 ring-primary/20' : '',
      )}
    >
      {locked ? (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
          <Lock className="h-2.5 w-2.5" /> Premium
        </span>
      ) : null}
      <div className="aspect-video overflow-hidden rounded-md bg-muted">
        <img
          src={template.thumbnail}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <h3 className="font-medium">{template.name}</h3>
        {active ? (
          <span className="inline-flex items-center gap-1 text-xs text-primary">
            <Check className="h-3 w-3" /> Active
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
    </button>
  );
}
