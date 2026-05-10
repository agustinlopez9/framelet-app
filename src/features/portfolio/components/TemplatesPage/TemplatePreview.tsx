import { useEffect, useRef, useState } from 'react';
import type { ImageFolder, Portfolio, PortfolioImage } from '@/features/portfolio/types';
import { TabbedTemplateHost } from '@/features/public-showcase/TabbedTemplateHost';

const PREVIEW_VIRTUAL_WIDTH = 1280;
const PREVIEW_DEFAULT_CONTENT_HEIGHT = 720;

interface TemplatePreviewProps {
  portfolio: Portfolio;
  images: PortfolioImage[];
  folders: ImageFolder[];
  templateIdOverride: string;
}

export function TemplatePreview({
  portfolio,
  images,
  folders,
  templateIdOverride,
}: TemplatePreviewProps) {
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
          style={{
            width: PREVIEW_VIRTUAL_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
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
