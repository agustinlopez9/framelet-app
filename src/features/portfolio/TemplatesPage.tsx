import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFolders, useImages, useUpdatePortfolio } from './queries';
import { usePortfolioContext } from './PortfolioContext';
import { ensureRegistered, list as listTemplates } from '@/templates';
import { TabbedTemplateHost } from '@/features/public-showcase/TabbedTemplateHost';
import { toast } from '@/hooks/use-toast';
import { Check, ExternalLink, Lock } from 'lucide-react';
import type { ImageFolder, Portfolio, PortfolioImage } from '@/types';

ensureRegistered();

const PREVIEW_VIRTUAL_WIDTH = 1280;
const PREVIEW_DEFAULT_CONTENT_HEIGHT = 720;

interface TemplatePreviewProps {
  portfolio: Portfolio;
  images: PortfolioImage[];
  folders: ImageFolder[];
  templateIdOverride: string;
}

function TemplatePreview({ portfolio, images, folders, templateIdOverride }: TemplatePreviewProps) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(PREVIEW_DEFAULT_CONTENT_HEIGHT);

  useEffect(() => {
    const node = outerRef.current;
    if (!node) return;
    const update = () => {
      const width = node.clientWidth;
      const next = width > 0 ? width / PREVIEW_VIRTUAL_WIDTH : 1;
      setScale(Math.round(next * 1000) / 1000);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const update = () => {
      const h = node.getBoundingClientRect().height / (scale || 1);
      if (h > 0) setContentHeight(Math.round(h));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, [scale, templateIdOverride, images.length]);

  const spacerHeight = Math.max(120, Math.round(contentHeight * scale));

  return (
    <div
      ref={outerRef}
      data-testid="template-preview"
      className="relative w-full overflow-y-auto overflow-x-hidden rounded-md border bg-background"
      style={{ height: 'min(75vh, 760px)', contain: 'layout paint' }}
    >
      <div className="relative w-full" style={{ height: spacerHeight }}>
        <div
          ref={stageRef}
          className="absolute left-0 top-0"
          style={{ width: PREVIEW_VIRTUAL_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          <TabbedTemplateHost
            portfolio={{ ...portfolio, templateId: templateIdOverride }}
            images={images}
            folders={folders}
            inPreview
          />
        </div>
      </div>
    </div>
  );
}

export function TemplatesPage() {
  const { portfolio, plan } = usePortfolioContext();
  const { data: images } = useImages(portfolio.id);
  const { data: folders = [] } = useFolders(portfolio.id);
  const update = useUpdatePortfolio(portfolio.id);
  const templates = listTemplates();
  const [previewId, setPreviewId] = useState<string | null>(null);

  const previewing = previewId ?? portfolio.templateId;

  async function selectTemplate(id: string) {
    const template = templates.find((t) => t.id === id);
    if (template?.premiumOnly && plan === 'free') {
      toast({ title: 'Premium template', description: 'Upgrade to Premium to use this template.', variant: 'destructive' });
      return;
    }
    try {
      await update.mutateAsync({ id: portfolio.id, patch: { templateId: id } });
      toast({ title: `Template set to ${template?.name ?? id}` });
      setPreviewId(null);
    } catch (err) {
      toast({
        title: 'Could not change template',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  }

  const publicPath = `/${portfolio.portfolioHandle}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose a template</CardTitle>
          <CardDescription>
            Click a template to preview it with your actual portfolio. Confirm to apply.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const active = template.id === portfolio.templateId;
              const previewActive = template.id === previewing;
              const locked = template.premiumOnly && plan === 'free';
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    if (locked) {
                      toast({ title: 'Premium template', description: 'Upgrade to Premium to use this template.' });
                      return;
                    }
                    setPreviewId(template.id);
                  }}
                  className={cn(
                    'group relative flex flex-col rounded-lg border bg-card p-4 text-left transition-all',
                    locked ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary/40',
                    previewActive && !locked ? 'border-primary ring-2 ring-primary/20' : '',
                  )}
                >
                  {locked ? (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                      <Lock className="h-2.5 w-2.5" /> Premium
                    </span>
                  ) : null}
                  <div className="aspect-video overflow-hidden rounded-md bg-muted">
                    <img
                      src={template.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <h3 className="font-medium">{template.name}</h3>
                    {active ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Preview: {templates.find((t) => t.id === previewing)?.name}</CardTitle>
            <CardDescription>Your portfolio rendered through this template.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={publicPath} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Open page
              </a>
            </Button>
            {previewing !== portfolio.templateId ? (
              <Button onClick={() => selectTemplate(previewing)} disabled={update.isPending}>
                {update.isPending ? 'Applying…' : 'Apply'}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <TemplatePreview
            portfolio={portfolio}
            images={images ?? []}
            folders={folders}
            templateIdOverride={previewing}
          />
        </CardContent>
      </Card>
    </div>
  );
}
