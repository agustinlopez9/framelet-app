import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeScope } from './ThemeScope';
import { hexToHslString, lighten } from './color';
import { arcticFrost, oceanDepths } from './catalog';
import './index'; // ensureRegistered

describe('ThemeScope', () => {
  it('injects gallery role tokens for headings, descriptions, bg, and accent', () => {
    const { container } = render(
      <ThemeScope themeId="ocean-depths">
        <span>child</span>
      </ThemeScope>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('data-theme-scope')).toBe('ocean-depths');
    expect(wrapper.style.getPropertyValue('--gallery-heading')).toBe(
      hexToHslString(oceanDepths.palette.accent),
    );
    expect(wrapper.style.getPropertyValue('--gallery-description')).toBe(
      lighten(oceanDepths.palette.accent, 30),
    );
    expect(wrapper.style.getPropertyValue('--gallery-bg')).toBe(
      hexToHslString(oceanDepths.palette.secondary),
    );
    expect(wrapper.style.getPropertyValue('--gallery-accent')).toBe(
      hexToHslString(oceanDepths.palette.primary),
    );
  });

  it('points shadcn tokens at the new role mapping', () => {
    const { container } = render(
      <ThemeScope themeId="ocean-depths">
        <span>child</span>
      </ThemeScope>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    // background = secondary (page surface uses the gallery bg role)
    expect(wrapper.style.getPropertyValue('--background')).toBe(
      hexToHslString(oceanDepths.palette.secondary),
    );
    // foreground = accent (headings use the darkest tone)
    expect(wrapper.style.getPropertyValue('--foreground')).toBe(
      hexToHslString(oceanDepths.palette.accent),
    );
    // muted-foreground = description (lighter same-family tone)
    expect(wrapper.style.getPropertyValue('--muted-foreground')).toBe(
      lighten(oceanDepths.palette.accent, 30),
    );
  });

  it('falls back to the default theme on unknown id and still renders', () => {
    const { container } = render(
      <ThemeScope themeId="not-a-real-theme">
        <span>child</span>
      </ThemeScope>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue('--primary')).toBe(
      hexToHslString(oceanDepths.palette.primary),
    );
  });

  it('switches palette when themeId changes', () => {
    const { container, rerender } = render(
      <ThemeScope themeId="ocean-depths">
        <span>child</span>
      </ThemeScope>,
    );
    let wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue('--primary')).toBe(
      hexToHslString(oceanDepths.palette.primary),
    );
    rerender(
      <ThemeScope themeId="arctic-frost">
        <span>child</span>
      </ThemeScope>,
    );
    wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue('--primary')).toBe(
      hexToHslString(arcticFrost.palette.primary),
    );
  });
});
