import { useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ImageFolder, Portfolio, PortfolioImage } from '@/types';
import { TemplateHost } from './TemplateHost';
import { PortfolioFooter } from './PortfolioFooter';

interface TabbedTemplateHostProps {
  portfolio: Portfolio;
  images: PortfolioImage[];
  folders: ImageFolder[];
  inPreview?: boolean;
}

const ALL_TAB_ID = '__all__';

/**
 * Wraps {@link TemplateHost} with a folder-aware tab strip.
 *
 * - Always renders the portfolio header (title + bio) above the tabs so the
 *   tab strip reads as section navigation, not a top-of-page control.
 * - In `tabs` mode: shows an "All images" tab plus a tab per non-hidden folder
 *   that contains images. Each tab swaps the image set passed to the template.
 * - In `flat` mode (or when no non-hidden folders contain images): renders all
 *   non-hidden images in a single template instance with no tab strip.
 */
export function TabbedTemplateHost({
  portfolio,
  images,
  folders,
  inPreview = false,
}: TabbedTemplateHostProps) {
  const visibleFolders = useMemo(
    () => folders.filter((f) => !f.hidden).sort((a, b) => a.position - b.position),
    [folders],
  );

  const hiddenFolderIds = useMemo(
    () => new Set(folders.filter((f) => f.hidden).map((f) => f.id)),
    [folders],
  );

  const visibleImages = useMemo(
    () => images.filter((img) => !img.folderId || !hiddenFolderIds.has(img.folderId)),
    [images, hiddenFolderIds],
  );

  const visibleFolderIds = useMemo(() => new Set(visibleFolders.map((f) => f.id)), [visibleFolders]);
  const folderHasImage = useMemo(() => {
    const set = new Set<string>();
    for (const img of visibleImages) {
      if (img.folderId && visibleFolderIds.has(img.folderId)) set.add(img.folderId);
    }
    return set;
  }, [visibleImages, visibleFolderIds]);

  // Decide whether to show tabs at all. Tabs mode requires at least one
  // non-hidden folder that contains images; otherwise we fall through to flat.
  const tabsModeRequested = (portfolio.folderDisplayMode ?? 'flat') === 'tabs';
  const usableFolders = visibleFolders.filter((f) => folderHasImage.has(f.id));
  const showTabs = tabsModeRequested && usableFolders.length > 0;

  const tabs = useMemo(() => {
    if (!showTabs) return [];
    const list: { id: string; label: string }[] = [{ id: ALL_TAB_ID, label: 'All images' }];
    for (const f of usableFolders) list.push({ id: f.id, label: f.name });
    return list;
  }, [showTabs, usableFolders]);

  const [activeTab, setActiveTab] = useState<string>(() => tabs[0]?.id ?? ALL_TAB_ID);

  if (!showTabs) {
    return (
      <>
        <PortfolioHeader portfolio={portfolio} />
        <TemplateHost
          portfolio={portfolio}
          images={visibleImages}
          inPreview={inPreview}
          hideHeader
        />
        {inPreview ? null : <PortfolioFooter portfolio={portfolio} />}
      </>
    );
  }

  const current = tabs.find((t) => t.id === activeTab) ?? tabs[0];
  const currentImages =
    current.id === ALL_TAB_ID
      ? visibleImages
      : visibleImages.filter((img) => img.folderId === current.id);

  return (
    <>
      <PortfolioHeader portfolio={portfolio} />
      <div className="mx-auto mb-8 mt-6 max-w-6xl px-4">
        <div className="rounded-md border border-border bg-card/50 px-4 shadow-sm">
          <Tabs value={current.id} onValueChange={setActiveTab}>
            <TabsList className="h-12 bg-transparent">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      <TemplateHost
        portfolio={portfolio}
        images={currentImages}
        inPreview={inPreview}
        hideHeader
      />
      {inPreview ? null : <PortfolioFooter portfolio={portfolio} />}
    </>
  );
}

function PortfolioHeader({ portfolio }: { portfolio: Portfolio }) {
  return (
    <header className="mx-auto max-w-6xl px-4 pb-10 pt-16 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">
        {portfolio.title || portfolio.handle}
      </h1>
      {portfolio.bio ? (
        <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">{portfolio.bio}</p>
      ) : null}
    </header>
  );
}
