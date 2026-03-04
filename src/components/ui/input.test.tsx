import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter name" />);
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = vi.fn();
    render(<Input placeholder="Enter name" onChange={handleChange} />);
    
    const input = screen.getByPlaceholderText('Enter name');
    fireEvent.change(input, { target: { value: 'John' } });
    
    expect(handleChange).toHaveBeenCalled();
    expect((input as HTMLInputElement).value).toBe('John');
  });

  it('is disabled when the disabled prop is true', () => {
    render(<Input placeholder="Enter name" disabled />);
    const input = screen.getByPlaceholderText('Enter name');
    expect(input).toBeDisabled();
  });

  it('applies error classes when aria-invalid is true', () => {
    render(<Input placeholder="Enter name" aria-invalid="true" />);
    const input = screen.getByPlaceholderText('Enter name');
    expect(input).toHaveClass('aria-invalid:border-destructive/60');
  });
});
