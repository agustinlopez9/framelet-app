import { useCallback, useEffect, useState } from 'react';

export function reconcileSelection(prev: Set<string>, visibleIds: string[]): Set<string> {
  if (prev.size === 0) return prev;
  const visible = new Set(visibleIds);
  let changed = false;
  const next = new Set<string>();
  for (const id of prev) {
    if (visible.has(id)) next.add(id);
    else changed = true;
  }
  return changed ? next : prev;
}

export function useImageSelection(visibleIds: string[]) {
  const [selection, setSelection] = useState<Set<string>>(new Set());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelection((prev) => reconcileSelection(prev, visibleIds));
  }, [visibleIds]);

  const toggleSelection = useCallback((id: string) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelection(new Set()), []);

  const selectAll = useCallback(() => setSelection(new Set(visibleIds)), [visibleIds]);

  return { selection, toggleSelection, clearSelection, selectAll };
}
