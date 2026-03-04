import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Switch } from './switch';

describe('Switch', () => {
  it('renders correctly', () => {
    render(<Switch id="test-switch" />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('handles state changes', () => {
    const handleCheckedChange = vi.fn();
    render(<Switch id="test-switch" onCheckedChange={handleCheckedChange} />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it('is disabled when the disabled prop is true', () => {
    render(<Switch id="test-switch" disabled />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeDisabled();
  });

  it('shows checked state when checked prop is true', () => {
    render(<Switch id="test-switch" checked={true} />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('data-state', 'checked');
  });
});
