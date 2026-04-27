import { register } from './registry';
import { simpleGridTemplate } from './simple-grid';
import { sideTitlesTemplate } from './side-titles';
import { alternatingTitlesTemplate } from './alternating-titles';
import { verticalFocusTemplate } from './vertical-focus';
import { gallery3dTemplate } from './gallery-3d';

let initialized = false;
export function ensureRegistered(): void {
  if (initialized) return;
  register(simpleGridTemplate);
  register(sideTitlesTemplate);
  register(alternatingTitlesTemplate);
  register(verticalFocusTemplate);
  register(gallery3dTemplate);
  initialized = true;
}

ensureRegistered();

export * from './registry';
export * from './types';
