import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  portfolioMetadataSchema,
  type PortfolioMetadataValues,
} from '@/features/portfolio/schemas';
import type { Portfolio } from '@/features/portfolio/types';
import { useUpdatePortfolio } from '@/queries';
import { list as listThemes } from '@/themes';
import { TwoToneSwatch } from '@/themes/TwoToneSwatch';

type ThemeValues = Pick<PortfolioMetadataValues, 'galleryThemeId'>;

export function ThemeCard({ portfolio }: { portfolio: Portfolio }) {
  const update = useUpdatePortfolio(portfolio.id);
  const themes = listThemes();
  const form = useForm<ThemeValues>({
    resolver: zodResolver(portfolioMetadataSchema.pick({ galleryThemeId: true })),
    defaultValues: { galleryThemeId: portfolio.galleryThemeId },
  });

  useEffect(() => {
    form.reset({ galleryThemeId: portfolio.galleryThemeId });
  }, [portfolio.galleryThemeId, form]);

  async function onSubmit(values: ThemeValues) {
    try {
      await update.mutateAsync({ id: portfolio.id, patch: values });
      toast({ title: 'Theme saved' });
    } catch (err) {
      toast({
        title: 'Could not save theme',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gallery theme</CardTitle>
        <CardDescription>Color palette applied to your public portfolio.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="galleryThemeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Gallery theme</FormLabel>
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
            <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>
              {update.isPending ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
