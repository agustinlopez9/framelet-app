import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  portfolioMetadataSchema,
  SOCIAL_PLATFORMS,
  type PortfolioMetadataValues,
} from '@/features/portfolio/schemas';
import type { Portfolio, SocialPlatform } from '@/features/portfolio/types';
import { useUpdatePortfolio } from '@/queries';
import { platformMeta } from '@/features/public-showcase/PortfolioFooter';

type SocialLinksValues = Pick<PortfolioMetadataValues, 'socialLinks'>;

export function SocialLinksCard({ portfolio }: { portfolio: Portfolio }) {
  const update = useUpdatePortfolio(portfolio.id);
  const form = useForm<SocialLinksValues>({
    resolver: zodResolver(portfolioMetadataSchema.pick({ socialLinks: true })),
    defaultValues: { socialLinks: portfolio.socialLinks },
  });
  const socialLinksField = useFieldArray({ control: form.control, name: 'socialLinks' });

  useEffect(() => {
    form.reset({ socialLinks: portfolio.socialLinks });
  }, [portfolio.socialLinks, form]);

  async function onSubmit(values: SocialLinksValues) {
    try {
      await update.mutateAsync({ id: portfolio.id, patch: values });
      toast({ title: 'Social links saved' });
    } catch (err) {
      toast({
        title: 'Could not save social links',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social links</CardTitle>
        <CardDescription>
          Shown as icon links in the footer of your public portfolio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="socialLinks"
              render={() => (
                <FormItem>
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
                      onClick={() => socialLinksField.append({ platform: 'instagram', url: '' })}
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
  );
}
