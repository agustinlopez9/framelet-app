import { useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ImageFolder, Portfolio, PortfolioImage } from '@/types';
import { TemplateHost } from './TemplateHost';

interface TabbedTemplateHostProps {
  portfolio: Portfolio;
  images: PortfolioImage[];
  folders: ImageFolder[];
  inPreview?: boolean;
}

const UNFILED_TAB_ID = '__unfiled__';

/**
 * Wraps {@link TemplateHost} with a folder-aware tab strip.
 *
 * - In `tabs` mode: shows a tab per non-hidden folder, plus an "Unfiled" tab
 *   when unfiled images exist. Each tab swaps the image set passed to the
 *   active template.
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

  const unfiledImages = useMemo(
    () => visibleImages.filter((img) => !img.folderId),
    [visibleImages],
  );

  // Decide whether to show tabs at all. Tabs mode requires at least one
  // non-hidden folder that contains images; otherwise we fall through to flat.
  const tabsModeRequested = (portfolio.folderDisplayMode ?? 'flat') === 'tabs';
  const usableFolders = visibleFolders.filter((f) => folderHasImage.has(f.id));
  const showTabs = tabsModeRequested && usableFolders.length > 0;

  const tabs = useMemo(() => {
    if (!showTabs) return [];
    const list = usableFolders.map((f) => ({ id: f.id, label: f.name }));
    if (unfiledImages.length > 0) list.push({ id: UNFILED_TAB_ID, label: 'Unfiled' });
    return list;
  }, [showTabs, usableFolders, unfiledImages.length]);

  const [activeTab, setActiveTab] = useState<string>(() => tabs[0]?.id ?? '');

  if (!showTabs) {
    return <TemplateHost portfolio={portfolio} images={visibleImages} inPreview={inPreview} />;
  }

  const current = tabs.find((t) => t.id === activeTab) ?? tabs[0];
  const currentImages =
    current.id === UNFILED_TAB_ID
      ? unfiledImages
      : visibleImages.filter((img) => img.folderId === current.id);

  return (
    <div>
      <div className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4">
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
      <TemplateHost portfolio={portfolio} images={currentImages} inPreview={inPreview} />
    </div>
  );
}
