import type { ReactNode } from 'react';

interface LightboxToolbarProps {
  topToolbar?: ReactNode;
  activeIndex: number;
  total: number;
}

export function LightboxToolbar({ topToolbar, activeIndex, total }: LightboxToolbarProps) {
  return (
    <>
      {topToolbar ? (
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2">{topToolbar}</div>
      ) : null}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm tabular-nums backdrop-blur">
        {activeIndex + 1} / {total}
      </div>
    </>
  );
}
