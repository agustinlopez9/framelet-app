import { afterEach, describe, expect, it } from 'vitest';
import { _resetForTests, get, list, register } from './registry';
import type { Template } from './types';

function makeTemplate(id: string): Template {
  return {
    id,
    name: id,
    description: '',
    thumbnail: '',
    defaultConfig: {},
    loadComponent: async () => () => null,
  };
}

afterEach(() => _resetForTests());

describe('template registry', () => {
  it('registers and returns a template by id', () => {
    register(makeTemplate('alpha'));
    expect(get('alpha')?.id).toBe('alpha');
  });

  it('returns undefined for unknown ids', () => {
    expect(get('does-not-exist')).toBeUndefined();
  });

  it('lists templates in registration order', () => {
    register(makeTemplate('alpha'));
    register(makeTemplate('beta'));
    register(makeTemplate('gamma'));
    expect(list().map((t) => t.id)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('throws on duplicate id', () => {
    register(makeTemplate('dup'));
    expect(() => register(makeTemplate('dup'))).toThrow(/Duplicate template id/);
  });

  it('list returns a copy that does not mutate the registry', () => {
    register(makeTemplate('alpha'));
    const copy = list();
    copy.push(makeTemplate('extra'));
    expect(list()).toHaveLength(1);
  });

  it('preserves the optional interactive flag', () => {
    const opted = { ...makeTemplate('opt-out'), interactive: false } as const;
    register(opted);
    register(makeTemplate('default'));
    expect(get('opt-out')?.interactive).toBe(false);
    expect(get('default')?.interactive).toBeUndefined();
  });
});
