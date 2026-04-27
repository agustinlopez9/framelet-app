import type { Template } from './types';

const registry: Template[] = [];
const ids = new Set<string>();

export function register(template: Template): void {
  if (ids.has(template.id)) {
    throw new Error(`Duplicate template id: "${template.id}"`);
  }
  ids.add(template.id);
  registry.push(template);
}

export function get(id: string): Template | undefined {
  return registry.find((t) => t.id === id);
}

export function list(): Template[] {
  return [...registry];
}

export const DEFAULT_TEMPLATE_ID = 'simple-grid';

/** For tests: clears the registry. */
export function _resetForTests(): void {
  registry.length = 0;
  ids.clear();
}
