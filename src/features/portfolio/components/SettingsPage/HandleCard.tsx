import { useRef, useState } from 'react';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Copy, ExternalLink, Pencil, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Portfolio } from '@/features/portfolio/types';
import type { User } from '@/types';
import { useUpdatePortfolio } from '@/queries';

const portfolioHandleSchema = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]{0,49}$/,
    'Use 1–50 chars: lowercase letters, numbers, hyphens; must start with a letter or number.',
  );

interface HandleCardProps {
  portfolio: Portfolio;
  user: User;
}

export function HandleCard({ portfolio, user }: HandleCardProps) {
  const update = useUpdatePortfolio(portfolio.id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(portfolio.portfolioHandle);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function startEdit() {
    setDraft(portfolio.portfolioHandle);
    setError(null);
    setEditing(true);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  }

  function cancelEdit() {
    setDraft(portfolio.portfolioHandle);
    setError(null);
    setEditing(false);
  }

  async function confirmEdit() {
    setError(null);
    const value = draft.trim().toLowerCase();
    if (value === portfolio.portfolioHandle) {
      setEditing(false);
      return;
    }
    const parsed = portfolioHandleSchema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid handle.');
      return;
    }
    try {
      await update.mutateAsync({ id: portfolio.id, patch: { portfolioHandle: value } });
      toast({ title: 'Portfolio URL updated' });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update handle.');
    }
  }

  const previewHandle = editing
    ? draft.trim().toLowerCase() || 'portfolio'
    : portfolio.portfolioHandle;
  const persistedPath = `/${user.username}/${portfolio.portfolioHandle}`;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${persistedPath}`);
      toast({ title: 'Copied URL' });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio URL</CardTitle>
        <CardDescription>
          The URL-slug for this specific portfolio. Must be unique within your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label htmlFor="handle-input">Portfolio handle</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            framelet.app/{user.username}/
          </span>
          <Input
            id="handle-input"
            ref={inputRef}
            value={editing ? draft : portfolio.portfolioHandle}
            readOnly={!editing}
            onChange={(e) => setDraft(e.target.value.toLowerCase())}
            onKeyDown={(e) => {
              if (!editing) return;
              if (e.key === 'Enter') {
                e.preventDefault();
                void confirmEdit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
              }
            }}
            className={cn('pr-20', error && 'border-destructive')}
            style={{ paddingLeft: `${((user.username ?? '').length + 16) * 7.5}px` }}
            autoCapitalize="none"
            autoComplete="off"
            maxLength={50}
          />
          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {editing ? (
              <>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={confirmEdit}
                  disabled={update.isPending}
                  aria-label="Save handle"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={cancelEdit}
                  disabled={update.isPending}
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={startEdit}
                aria-label="Edit handle"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <p className="text-xs text-muted-foreground">
          Preview:{' '}
          <code>
            framelet.app/{user.username}/{previewHandle}
          </code>
          {editing ? ' (not saved yet)' : null}
        </p>
        {!editing ? (
          <div className="flex items-center gap-2">
            <Button asChild type="button" variant="outline" size="sm">
              <Link to={persistedPath} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={copyUrl}>
              <Copy className="mr-2 h-4 w-4" />
              Copy URL
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
