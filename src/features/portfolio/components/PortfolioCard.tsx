import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import type { Portfolio } from '@/features/portfolio/types';
import { get as getTemplate } from '@/templates';

interface PortfolioCardProps {
  portfolio: Portfolio;
  username?: string;
  onSetDefault: (id: string) => void;
  isSettingDefault: boolean;
}

export function PortfolioCard({
  portfolio,
  username,
  onSetDefault,
  isSettingDefault,
}: PortfolioCardProps) {
  const template = getTemplate(portfolio.templateId);
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{portfolio.title || 'Untitled'}</CardTitle>
            <CardDescription className="truncate">
              {username && portfolio.portfolioHandle ? (
                <Link
                  to={`/${username}/${portfolio.portfolioHandle}`}
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
              <Badge variant="secondary" className="text-xs">
                Default
              </Badge>
            ) : null}
            <Badge variant={portfolio.published ? 'default' : 'outline'} className="text-xs">
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
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
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
              onClick={() => onSetDefault(portfolio.id)}
              disabled={isSettingDefault}
              title="Set as default portfolio"
            >
              <Star className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
