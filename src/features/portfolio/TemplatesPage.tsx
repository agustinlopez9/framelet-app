import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useFolders, useImages, useUpdatePortfolio } from '@/queries';
import { usePortfolioContext } from '@/context/PortfolioContext';
import { ensureRegistered, list as listTemplates } from '@/templates';
import { toast } from '@/hooks/use-toast';
import { TemplateCard } from './components/TemplatesPage/TemplateCard';
import { TemplatePreview } from './components/TemplatesPage/TemplatePreview';

ensureRegistered();

export function TemplatesPage() {
  const { portfolio, plan } = usePortfolioContext();
  const { data: images = [] } = useImages(portfolio.id);
  const { data: folders = [] } = useFolders(portfolio.id);
  const update = useUpdatePortfolio(portfolio.id);
  const templates = listTemplates();
  const [previewId, setPreviewId] = useState<string | null>(null);

  const previewing = previewId ?? portfolio.templateId;

  async function selectTemplate(id: string) {
    const template = templates.find((t) => t.id === id);
    if (template?.premiumOnly && plan === 'free') {
      toast({ title: 'Premium template', description: 'Upgrade to Premium to use this template.' });
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
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                active={template.id === portfolio.templateId}
                previewing={template.id === previewing}
                plan={plan}
                onSelect={() => {
                  if (template.premiumOnly && plan === 'free') {
                    toast({
                      title: 'Premium template',
                      description: 'Upgrade to Premium to use this template.',
                    });
                    return;
                  }
                  setPreviewId(template.id);
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">
              Preview: {templates.find((t) => t.id === previewing)?.name}
            </CardTitle>
            <CardDescription>Your portfolio rendered through this template.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`/${portfolio.portfolioHandle}`} target="_blank" rel="noreferrer">
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
            images={images}
            folders={folders}
            templateIdOverride={previewing}
          />
        </CardContent>
      </Card>
    </div>
  );
}
