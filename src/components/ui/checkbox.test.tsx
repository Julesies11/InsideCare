import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('renders correctly', () => {
    render(<Checkbox id="test-checkbox" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('handles state changes', () => {
    const handleCheckedChange = vi.fn();
    render(<Checkbox id="test-checkbox" onCheckedChange={handleCheckedChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it('is disabled when the disabled prop is true', () => {
    render(<Checkbox id="test-checkbox" disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('shows checked state when checked prop is true', () => {
    render(<Checkbox id="test-checkbox" checked={true} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });
});
