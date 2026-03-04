import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label } from './label';

describe('Label', () => {
  it('renders correctly with text', () => {
    render(<Label>Username</Label>);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('applies the correct variant classes', () => {
    const { rerender } = render(<Label variant="primary">Primary</Label>);
    expect(screen.getByText('Primary')).toHaveClass('font-medium');

    rerender(<Label variant="secondary">Secondary</Label>);
    expect(screen.getByText('Secondary')).toHaveClass('font-normal');
  });

  it('associates with an input via htmlFor', () => {
    render(
      <div>
        <Label htmlFor="test-input">Label Text</Label>
        <input id="test-input" />
      </div>
    );
    
    const label = screen.getByText('Label Text');
    expect(label).toHaveAttribute('for', 'test-input');
    
    // Check if the input is found by the label
    expect(screen.getByLabelText('Label Text')).toBeInTheDocument();
  });
});
