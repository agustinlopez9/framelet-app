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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  portfolioMetadataSchema,
  type PortfolioMetadataValues,
} from '@/features/portfolio/schemas';
import type { Portfolio } from '@/features/portfolio/types';
import { useUpdatePortfolio } from '@/queries';

type MetadataValues = Pick<PortfolioMetadataValues, 'title' | 'bio'>;

export function MetadataCard({ portfolio }: { portfolio: Portfolio }) {
  const update = useUpdatePortfolio(portfolio.id);
  const form = useForm<MetadataValues>({
    resolver: zodResolver(portfolioMetadataSchema.pick({ title: true, bio: true })),
    defaultValues: { title: portfolio.title, bio: portfolio.bio },
  });

  useEffect(() => {
    form.reset({ title: portfolio.title, bio: portfolio.bio });
  }, [portfolio.title, portfolio.bio, form]);

  async function onSubmit(values: MetadataValues) {
    try {
      await update.mutateAsync({ id: portfolio.id, patch: values });
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
    <Card>
      <CardHeader>
        <CardTitle>Portfolio info</CardTitle>
        <CardDescription>Title and bio displayed on your portfolio.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>
              {update.isPending ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
