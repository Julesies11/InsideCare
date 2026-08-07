import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SortIcon } from './sort-icon';

describe('SortIcon', () => {
  it('renders neutral opacity-30 icon when field is not selected', () => {
    const { container } = render(
      <SortIcon field="name" currentField="created_at" direction="asc" />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.classList.toString()).toContain('opacity-30');
  });

  it('renders ascending icon when field is selected and direction is asc', () => {
    const { container } = render(
      <SortIcon field="name" currentField="name" direction="asc" />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.classList.toString()).toContain('text-primary');
  });

  it('renders descending icon when field is selected and direction is desc', () => {
    const { container } = render(
      <SortIcon field="name" currentField="name" direction="desc" />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('supports TanStack DataGrid activeSort format', () => {
    const { container } = render(
      <SortIcon field="name" activeSort={{ id: 'name', desc: true }} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
