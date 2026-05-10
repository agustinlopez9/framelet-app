import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  useMyPortfolios,
  useMyUser,
  useUserPlan,
  useSetDefaultPortfolio,
} from '@/queries';
import { FREE_STORAGE_BYTES, PREMIUM_STORAGE_BYTES } from '@/lib/api/images';
import { ensureRegistered } from '@/templates';
import { PortfolioCard } from './components/PortfolioCard';
import { formatBytes } from './utils';

ensureRegistered();

export function PortfolioListPage() {
  const { data: portfolios, isLoading: portfoliosLoading } = useMyPortfolios();
  const { data: user, isLoading: userLoading } = useMyUser();
  const { data: plan = 'free' } = useUserPlan(user?.id);
  const setDefault = useSetDefaultPortfolio();

  if (portfoliosLoading || userLoading) {
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
          <Button
            disabled
            title={`Upgrade to premium to create up to ${portfolioLimit} portfolios`}
          >
            <Plus className="mr-2 h-4 w-4" />
            New portfolio
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Storage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatBytes(storageUsed)} used</span>
            <span>
              {formatBytes(storageLimit)} total ({plan === 'premium' ? 'Premium' : 'Free'})
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(portfolios ?? []).map((portfolio) => (
          <PortfolioCard
            key={portfolio.id}
            portfolio={portfolio}
            username={user?.username}
            onSetDefault={handleSetDefault}
            isSettingDefault={setDefault.isPending}
          />
        ))}
      </div>
    </div>
  );
}
