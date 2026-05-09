import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useMyPortfolios, useMyUser, useUserPlan, useSetDefaultPortfolio } from './queries';
import { FREE_STORAGE_BYTES, PREMIUM_STORAGE_BYTES } from '@/lib/api/images';
import { get as getTemplate } from '@/templates';
import { ensureRegistered } from '@/templates';

ensureRegistered();

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function PortfolioListPage() {
  const { data: portfolios, isLoading: portfoliosLoading } = useMyPortfolios();
  const { data: user, isLoading: userLoading } = useMyUser();
  const { data: plan = 'free' } = useUserPlan(user?.id);
  const setDefault = useSetDefaultPortfolio();

  const isLoading = portfoliosLoading || userLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const storageUsed = user?.storageUsedBytes ?? 0;
  const storageLimit = plan === 'premium' ? PREMIUM_STORAGE_BYTES : FREE_STORAGE_BYTES;
  const storagePercent = Math.min(100, (storageUsed / storageLimit) * 100);
  const portfolioLimit = plan === 'premium' ? 5 : 1;
  const canCreateMore = (portfolios?.length ?? 0) < portfolioLimit;

  async function handleSetDefault(portfolioId: string) {
    try {
      await setDefault.mutateAsync(portfolioId);
      toast({ title: 'Default portfolio updated' });
    } catch (err) {
      toast({
        title: 'Could not update default',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Portfolios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {portfolios?.length ?? 0} / {portfolioLimit} portfolio{portfolioLimit !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreateMore ? (
          <Button asChild>
            <Link to="/dashboard/new">
              <Plus className="mr-2 h-4 w-4" />
              New portfolio
            </Link>
          </Button>
        ) : (
          <Button disabled title={`Upgrade to premium to create up to ${portfolioLimit} portfolios`}>
            <Plus className="mr-2 h-4 w-4" />
            New portfolio
          </Button>
        )}
      </div>

      {/* Storage quota bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Storage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatBytes(storageUsed)} used</span>
            <span>{formatBytes(storageLimit)} total ({plan === 'premium' ? 'Premium' : 'Free'})</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Portfolio cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(portfolios ?? []).map((portfolio) => {
          const template = getTemplate(portfolio.templateId);
          return (
            <Card key={portfolio.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {portfolio.title || 'Untitled'}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {user?.username && portfolio.portfolioHandle ? (
                        <Link
                          to={`/${user.username}/${portfolio.portfolioHandle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          /{portfolio.portfolioHandle}
                        </Link>
                      ) : (
                        `/${portfolio.portfolioHandle}`
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {portfolio.isDefault ? (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    ) : null}
                    <Badge
                      variant={portfolio.published ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {portfolio.published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-3">
                <div className="aspect-video overflow-hidden rounded-md bg-muted">
                  <img
                    src={template?.thumbnail}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{template?.name ?? portfolio.templateId}</p>
                <div className="flex gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link to={`/dashboard/${portfolio.id}`}>Manage</Link>
                  </Button>
                  {!portfolio.isDefault ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(portfolio.id)}
                      disabled={setDefault.isPending}
                      title="Set as default portfolio"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
