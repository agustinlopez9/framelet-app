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
import { portfolioMetadataSchema, type PortfolioMetadataValues } from './schemas';
import { useMyPortfolio, useUpdatePortfolio } from './queries';

export function SettingsPage() {
  const { data: portfolio } = useMyPortfolio();
  const update = useUpdatePortfolio();

  const form = useForm<PortfolioMetadataValues>({
    resolver: zodResolver(portfolioMetadataSchema),
    defaultValues: { title: '', bio: '' },
  });

  useEffect(() => {
    if (portfolio) {
      form.reset({ title: portfolio.title, bio: portfolio.bio });
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
    <Card>
      <CardHeader>
        <CardTitle>Portfolio settings</CardTitle>
        <CardDescription>Title and bio show up at the top of every template.</CardDescription>
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
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
