import type { Template, TemplateProps } from '../types';
import type { ComponentType } from 'react';

export const gallery3dTemplate: Template = {
  id: 'gallery-3d',
  name: '3D Gallery',
  description: 'A calm 3D presentation: one image centered, neighbors in soft perspective.',
  thumbnail: '/templates/gallery-3d.svg',
  defaultConfig: {},
  loadComponent: async () => {
    const mod = await import('./Gallery3D');
    return mod.default as ComponentType<TemplateProps>;
  },
};
