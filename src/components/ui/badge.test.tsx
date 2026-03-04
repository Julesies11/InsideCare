import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders correctly with children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies the correct variant classes', () => {
    const { rerender } = render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('bg-[var(--color-success-accent,var(--color-green-500))]');

    rerender(<Badge variant="destructive">Delete</Badge>);
    expect(screen.getByText('Delete')).toHaveClass('bg-destructive');
  });

  it('applies light appearance classes', () => {
    render(<Badge variant="success" appearance="light">Light Success</Badge>);
    expect(screen.getByText('Light Success')).toHaveClass('text-[var(--color-success-accent,var(--color-green-800))]');
  });

  it('applies the correct size classes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toHaveClass('h-5');

    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByText('Large')).toHaveClass('h-7');
  });
});
