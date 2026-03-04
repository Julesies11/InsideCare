import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('renders correctly', () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton')).toHaveClass('animate-pulse');
  });

  it('applies custom classes for size', () => {
    render(<Skeleton className="h-10 w-10 rounded-full" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('h-10');
    expect(skeleton).toHaveClass('w-10');
    expect(skeleton).toHaveClass('rounded-full');
  });
});
