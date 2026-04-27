import { Link } from 'react-router-dom';
import { useMyPortfolio, useImages, useUpdatePortfolio } from './queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { ExternalLink } from 'lucide-react';
import { get as getTemplate } from '@/templates';

export function DashboardOverview() {
  const { data: portfolio, isLoading } = useMyPortfolio();
  const { data: images } = useImages(portfolio?.id);
  const update = useUpdatePortfolio();

  if (isLoading || !portfolio) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const template = getTemplate(portfolio.templateId);
  const publicUrl = `/u/${portfolio.handle}`;

  async function togglePublished(next: boolean) {
    if (!portfolio) return;
    try {
      await update.mutateAsync({ id: portfolio.id, patch: { published: next } });
      toast({ title: next ? 'Portfolio published' : 'Portfolio unpublished' });
    } catch (err) {
      toast({
        title: 'Could not update publish state',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{portfolio.title || portfolio.handle}</CardTitle>
          <CardDescription>{portfolio.bio || 'Add a short bio in Settings.'}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            <Stat label="Images" value={images?.length ?? '–'} />
            <Stat label="Template" value={template?.name ?? portfolio.templateId} />
            <Stat label="Status" value={portfolio.published ? 'Published' : 'Unpublished'} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Published</span>
            <Switch
              checked={portfolio.published}
              onCheckedChange={togglePublished}
              disabled={update.isPending}
              aria-label="Toggle publish state"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Public URL</CardTitle>
          <CardDescription>
            {portfolio.published ? 'Anyone with this link can view your portfolio.' : 'Hidden until published.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <code className="rounded bg-muted px-2 py-1 text-sm">{publicUrl}</code>
            <Button asChild variant="outline" size="sm">
              <Link to={publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-medium">{value}</p>
    </div>
  );
}
