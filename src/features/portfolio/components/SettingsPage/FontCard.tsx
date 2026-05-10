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
import { fontCatalog } from '@/themes/fonts';

type FontValues = Pick<PortfolioMetadataValues, 'fontId' | 'fontScale' | 'folderDisplayMode'>;

export function FontCard({ portfolio }: { portfolio: Portfolio }) {
  const update = useUpdatePortfolio(portfolio.id);
  const form = useForm<FontValues>({
    resolver: zodResolver(
      portfolioMetadataSchema.pick({ fontId: true, fontScale: true, folderDisplayMode: true }),
    ),
    defaultValues: {
      fontId: portfolio.fontId as PortfolioMetadataValues['fontId'],
      fontScale: portfolio.fontScale,
      folderDisplayMode: portfolio.folderDisplayMode ?? 'flat',
    },
  });

  useEffect(() => {
    form.reset({
      fontId: portfolio.fontId as PortfolioMetadataValues['fontId'],
      fontScale: portfolio.fontScale,
      folderDisplayMode: portfolio.folderDisplayMode ?? 'flat',
    });
  }, [portfolio.fontId, portfolio.fontScale, portfolio.folderDisplayMode, form]);

  async function onSubmit(values: FontValues) {
    try {
      await update.mutateAsync({ id: portfolio.id, patch: values });
      toast({ title: 'Typography saved' });
    } catch (err) {
      toast({
        title: 'Could not save typography',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Typography</CardTitle>
        <CardDescription>Font family, size scale, and folder display mode.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fontId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Font</FormLabel>
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
              name="fontScale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type scale</FormLabel>
                  <FormControl>
                    <div role="radiogroup" aria-label="Type scale" className="flex gap-2">
                      {(
                        [
                          { id: 'small', label: 'Small' },
                          { id: 'regular', label: 'Regular' },
                          { id: 'large', label: 'Large' },
                        ] as const
                      ).map((opt) => {
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
              name="folderDisplayMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder display mode</FormLabel>
                  <FormControl>
                    <div role="radiogroup" aria-label="Folder display mode" className="flex gap-2">
                      {(
                        [
                          { id: 'tabs', label: 'Tabs' },
                          { id: 'flat', label: 'All at once' },
                        ] as const
                      ).map((opt) => {
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
            <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>
              {update.isPending ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
