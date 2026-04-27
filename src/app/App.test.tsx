import { describe, expect, it, vi } from 'vitest';

// Smoke test: the registry is wired and the typed env helper guards startup.
vi.mock('@/lib/env', () => ({
  env: { supabaseUrl: 'http://example.test', supabasePublishableKey: 'anon' },
}));

describe('app wiring', () => {
  it('initializes the template registry', async () => {
    const mod = await import('@/templates');
    expect(mod.list().length).toBeGreaterThanOrEqual(3);
    expect(mod.get('simple-grid')).toBeDefined();
    expect(mod.get('side-titles')).toBeDefined();
    expect(mod.get('gallery-3d')).toBeDefined();
  });
});
