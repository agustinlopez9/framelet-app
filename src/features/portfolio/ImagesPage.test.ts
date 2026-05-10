import { describe, expect, it } from 'vitest';
import { reconcileSelection } from '@/hooks/useImageSelection';

describe('reconcileSelection', () => {
  it('returns the same Set reference when prev is empty', () => {
    const prev = new Set<string>();
    expect(reconcileSelection(prev, ['a', 'b'])).toBe(prev);
  });

  it('returns the same Set reference when every selected id is still visible', () => {
    const prev = new Set(['a', 'b']);
    expect(reconcileSelection(prev, ['a', 'b', 'c'])).toBe(prev);
  });

  it('drops ids that are no longer visible', () => {
    const prev = new Set(['a', 'b', 'c']);
    const next = reconcileSelection(prev, ['b']);
    expect(next).not.toBe(prev);
    expect([...next]).toEqual(['b']);
  });

  it('returns an empty set when every selected id is gone', () => {
    const prev = new Set(['a', 'b']);
    const next = reconcileSelection(prev, []);
    expect(next.size).toBe(0);
  });
});
