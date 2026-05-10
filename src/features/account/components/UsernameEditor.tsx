import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, Pencil, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { isUsernameAvailable, AuthError } from '@/lib/api/auth';
import { usernameSchema } from '@/features/auth/schemas';
import { useUpdateUsername } from '@/queries';

export function UsernameEditor({ username }: { username: string }) {
  const update = useUpdateUsername();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(username);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function startEdit() {
    setDraft(username);
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
    setDraft(username);
    setError(null);
    setEditing(false);
  }

  async function confirmEdit() {
    setError(null);
    const value = draft.trim().toLowerCase();
    if (value === username) {
      setEditing(false);
      return;
    }
    const parsed = usernameSchema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid username.');
      return;
    }
    setChecking(true);
    try {
      const available = await isUsernameAvailable(value);
      if (!available) {
        setError('That username is already taken.');
        return;
      }
      await update.mutateAsync(value);
      toast({ title: 'Username updated' });
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof AuthError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not update username. Try again.',
      );
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="username-input">Username</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          framelet.app/
        </span>
        <Input
          id="username-input"
          ref={inputRef}
          value={editing ? draft : username}
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
          className={cn('pl-[108px] pr-20', error && 'border-destructive')}
          autoCapitalize="none"
          autoComplete="off"
          maxLength={30}
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
                disabled={checking || update.isPending}
                aria-label="Save username"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={cancelEdit}
                disabled={checking || update.isPending}
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
              aria-label="Edit username"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <p className="text-xs text-muted-foreground">
        Your portfolios live at{' '}
        <code>
          framelet.app/{editing ? draft.trim().toLowerCase() || 'your-username' : username}/…
        </code>
      </p>
    </div>
  );
}
