import { Link } from 'react-router-dom';
import { usePortfolioContext } from '@/context/PortfolioContext';
import { useMedia, useUpdatePortfolio } from '@/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Copy, ExternalLink } from 'lucide-react';
import { get as getTemplate } from '@/templates';

export function DashboardOverview() {
  const { portfolio, user } = usePortfolioContext();
  const { data: media } = useMedia(portfolio.id);
  const update = useUpdatePortfolio(portfolio.id);

  const template = getTemplate(portfolio.templateId);
  const hasUrl = !!user.username && !!portfolio.portfolioHandle;
  const publicPath = hasUrl ? `/${user.username}/${portfolio.portfolioHandle}` : null;
  const displayUrl = hasUrl ? `framelet.app${publicPath}` : 'URL not available yet';

  async function togglePublished(next: boolean) {
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

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${publicPath}`);
      toast({ title: 'Link copied' });
    } catch {
      toast({ title: 'Could not copy link', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            Manage your portfolio, share your link, and toggle publish.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            <Stat label="Media" value={media?.length ?? '–'} />
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
            {portfolio.published
              ? 'Anyone with this link can view your portfolio.'
              : 'Hidden until published.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <code className="rounded bg-muted px-2 py-1 text-sm">{displayUrl}</code>
            {hasUrl ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={copyUrl}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to={publicPath!} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </Link>
                </Button>
              </>
            ) : null}
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
