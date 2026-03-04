import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Separator } from './separator';

describe('Separator', () => {
  it('renders correctly', () => {
    render(<Separator data-testid="separator" />);
    expect(screen.getByTestId('separator')).toBeInTheDocument();
  });

  it('applies horizontal orientation correctly', () => {
    render(<Separator data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('h-px');
    expect(separator).toHaveClass('w-full');
  });

  it('applies vertical orientation correctly', () => {
    render(<Separator orientation="vertical" data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('h-full');
    expect(separator).toHaveClass('w-px');
  });

  it('has role="none" when decorative is true', () => {
    render(<Separator decorative={true} data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    // Radix Separator with decorative={true} sets role="none" or removes it
    expect(separator).toHaveAttribute('role', 'none');
  });

  it('has role="separator" when decorative is false', () => {
    render(<Separator decorative={false} data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('role', 'separator');
  });
});
