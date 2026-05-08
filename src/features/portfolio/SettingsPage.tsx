import { useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, Copy, ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { portfolioMetadataSchema, SOCIAL_PLATFORMS, type PortfolioMetadataValues } from './schemas';
import { useMyPortfolio, useUpdateHandle, useUpdatePortfolio } from './queries';
import { isHandleAvailable, AuthError } from '@/lib/api/auth';
import { handleSchema } from '@/features/auth/schemas';
import { list as listThemes } from '@/themes';
import { TwoToneSwatch } from '@/themes/TwoToneSwatch';
import { fontCatalog } from '@/themes/fonts';
import { platformMeta } from '@/features/public-showcase/PortfolioFooter';
import type { SocialPlatform } from '@/types';

export function SettingsPage() {
  const { data: portfolio } = useMyPortfolio();
  const update = useUpdatePortfolio();
  const themes = listThemes();

  const form = useForm<PortfolioMetadataValues>({
    resolver: zodResolver(portfolioMetadataSchema),
    defaultValues: {
      title: '',
      bio: '',
      galleryThemeId: 'ocean-depths',
      fontId: 'default',
      fontScale: 'regular',
      folderDisplayMode: 'flat',
      socialLinks: [],
    },
  });

  const socialLinksField = useFieldArray({
    control: form.control,
    name: 'socialLinks',
  });

  useEffect(() => {
    if (portfolio) {
      form.reset({
        title: portfolio.title,
        bio: portfolio.bio,
        galleryThemeId: portfolio.galleryThemeId,
        fontId: portfolio.fontId as PortfolioMetadataValues['fontId'],
        fontScale: portfolio.fontScale,
        folderDisplayMode: portfolio.folderDisplayMode ?? 'flat',
        socialLinks: portfolio.socialLinks,
      });
    }
  }, [portfolio, form]);

  if (!portfolio) return null;

  async function onSubmit(values: PortfolioMetadataValues) {
    try {
      await update.mutateAsync({ id: portfolio!.id, patch: values });
      toast({ title: 'Settings saved' });
    } catch (err) {
      toast({
        title: 'Could not save settings',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <HandleEditor handle={portfolio.handle} />
      <Card>
      <CardHeader>
        <CardTitle>Portfolio settings</CardTitle>
        <CardDescription>Title, bio, and the color palette for your public gallery.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input maxLength={80} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea rows={4} maxLength={500} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fontId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typography</FormLabel>
                  <FormDescription>
                    The font used on your public portfolio at <code>/u/{portfolio.handle}</code>.
                  </FormDescription>
                  <FormControl>
                    <div
                      role="radiogroup"
                      aria-label="Portfolio font"
                      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      {fontCatalog.map((font) => {
                        const selected = field.value === font.id;
                        return (
                          <button
                            key={font.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => field.onChange(font.id)}
                            className={cn(
                              'flex flex-col items-start gap-1 rounded-lg border bg-card p-3 text-left transition-all',
                              selected
                                ? 'border-primary ring-2 ring-primary/30'
                                : 'hover:border-primary/40',
                            )}
                          >
                            <span className="flex w-full items-center justify-between gap-2">
                              <span className="text-sm font-medium">{font.label}</span>
                              {selected ? (
                                <Check className="h-4 w-4 shrink-0 text-primary" />
                              ) : null}
                            </span>
                            <span
                              className="text-lg leading-tight"
                              style={{ fontFamily: font.stack }}
                            >
                              Aa — Framelet
                            </span>
                            <span className="line-clamp-2 text-xs text-muted-foreground">
                              {font.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="galleryThemeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gallery theme</FormLabel>
                  <FormDescription>
                    Color palette applied to your public portfolio at <code>/u/{portfolio.handle}</code>.
                  </FormDescription>
                  <FormControl>
                    <div
                      role="radiogroup"
                      aria-label="Gallery theme"
                      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      {themes.map((theme) => {
                        const selected = field.value === theme.id;
                        return (
                          <button
                            key={theme.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => field.onChange(theme.id)}
                            className={cn(
                              'flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-all',
                              selected
                                ? 'border-primary ring-2 ring-primary/30'
                                : 'hover:border-primary/40',
                            )}
                          >
                            <TwoToneSwatch
                              heading={theme.palette.accent}
                              bg={theme.palette.secondary}
                              size={48}
                              ariaLabel={`${theme.name} colors`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-medium">{theme.name}</span>
                                {selected ? (
                                  <Check className="h-4 w-4 shrink-0 text-primary" />
                                ) : null}
                              </span>
                              <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {theme.description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="folderDisplayMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder display mode</FormLabel>
                  <FormDescription>
                    Tabs mode shows your folders as tabs under the title and bio. Flat mode hides
                    folders from the public page and shows all images together.
                  </FormDescription>
                  <FormControl>
                    <div role="radiogroup" aria-label="Folder display mode" className="flex gap-2">
                      {([
                        { id: 'tabs', label: 'Tabs' },
                        { id: 'flat', label: 'All at once' },
                      ] as const).map((opt) => {
                        const selected = field.value === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => field.onChange(opt.id)}
                            className={cn(
                              'flex-1 rounded-lg border bg-card p-3 text-center text-sm font-medium transition-all',
                              selected
                                ? 'border-primary ring-2 ring-primary/30'
                                : 'hover:border-primary/40',
                            )}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fontScale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type scale</FormLabel>
                  <FormDescription>
                    Adjust the size of headings and body text on your public portfolio.
                  </FormDescription>
                  <FormControl>
                    <div role="radiogroup" aria-label="Type scale" className="flex gap-2">
                      {([
                        { id: 'small', label: 'Small' },
                        { id: 'regular', label: 'Regular' },
                        { id: 'large', label: 'Large' },
                      ] as const).map((opt) => {
                        const selected = field.value === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => field.onChange(opt.id)}
                            className={cn(
                              'flex-1 rounded-lg border bg-card p-3 text-center text-sm font-medium transition-all',
                              selected
                                ? 'border-primary ring-2 ring-primary/30'
                                : 'hover:border-primary/40',
                            )}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="socialLinks"
              render={() => (
                <FormItem>
                  <FormLabel>Social links</FormLabel>
                  <FormDescription>
                    Shown as icon links in the footer of your public portfolio. Pick a platform and
                    paste the full URL (must start with <code>http://</code> or <code>https://</code>).
                  </FormDescription>
                  <div className="space-y-2">
                    {socialLinksField.fields.map((linkField, idx) => (
                      <div
                        key={linkField.id}
                        className="flex flex-col gap-2 rounded-md border bg-card p-3 sm:flex-row sm:items-start"
                      >
                        <FormField
                          control={form.control}
                          name={`socialLinks.${idx}.platform` as const}
                          render={({ field: platformField }) => (
                            <FormItem className="sm:w-44">
                              <select
                                value={platformField.value}
                                onChange={(e) =>
                                  platformField.onChange(e.target.value as SocialPlatform)
                                }
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                aria-label={`Platform for link ${idx + 1}`}
                              >
                                {SOCIAL_PLATFORMS.map((platform) => (
                                  <option key={platform} value={platform}>
                                    {platformMeta(platform).label}
                                  </option>
                                ))}
                              </select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`socialLinks.${idx}.url` as const}
                          render={({ field: urlField }) => (
                            <FormItem className="flex-1">
                              <Input
                                type="url"
                                placeholder="https://…"
                                {...urlField}
                                aria-label={`URL for link ${idx + 1}`}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => socialLinksField.remove(idx)}
                          aria-label={`Remove link ${idx + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        socialLinksField.append({ platform: 'instagram', url: '' })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add link
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>
              {update.isPending ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
    </div>
  );
}

function FormDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function HandleEditor({ handle }: { handle: string }) {
  const update = useUpdateHandle();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(handle);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(handle);
  }, [handle, editing]);

  function startEdit() {
    setDraft(handle);
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
    setDraft(handle);
    setError(null);
    setEditing(false);
  }

  async function confirmEdit() {
    setError(null);
    const value = draft.trim().toLowerCase();
    if (value === handle) {
      setEditing(false);
      return;
    }
    const parsed = handleSchema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid handle.');
      return;
    }
    setChecking(true);
    try {
      const available = await isHandleAvailable(value);
      if (!available) {
        setError('That handle is already taken.');
        return;
      }
      await update.mutateAsync(value);
      toast({ title: 'Handle updated', description: `Your URL is now /u/${value}.` });
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof AuthError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not update handle. Try again.',
      );
    } finally {
      setChecking(false);
    }
  }

  const previewHandle = editing ? draft.trim().toLowerCase() || 'your-handle' : handle;
  const persistedUrl = `/u/${handle}`;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${persistedUrl}`);
      toast({ title: 'Copied URL' });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public URL</CardTitle>
        <CardDescription>
          Pick a short, memorable handle. It becomes your portfolio URL.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label htmlFor="handle-input">Handle</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            framelet.app/u/
          </span>
          <Input
            id="handle-input"
            ref={inputRef}
            value={editing ? draft : handle}
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
            className={cn('pl-[126px] pr-20', error && 'border-destructive focus-visible:ring-destructive')}
            autoCapitalize="none"
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'handle-error' : undefined}
            maxLength={30}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {editing ? (
              <>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={confirmEdit}
                  disabled={checking || update.isPending}
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
                  disabled={checking || update.isPending}
                  aria-label="Cancel editing handle"
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
        {error ? (
          <p id="handle-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Preview: <code>framelet.app/u/{previewHandle}</code>
          {editing ? ' (not saved yet)' : null}
        </p>
        {!editing ? (
          <div className="flex items-center gap-2">
            <Button asChild type="button" variant="outline" size="sm">
              <Link to={persistedUrl} target="_blank" rel="noreferrer">
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
