import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders correctly', () => {
    render(<Textarea placeholder="Enter notes" />);
    expect(screen.getByPlaceholderText('Enter notes')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = vi.fn();
    render(<Textarea placeholder="Enter notes" onChange={handleChange} />);
    
    const textarea = screen.getByPlaceholderText('Enter notes');
    fireEvent.change(textarea, { target: { value: 'Some notes' } });
    
    expect(handleChange).toHaveBeenCalled();
    expect((textarea as HTMLTextAreaElement).value).toBe('Some notes');
  });

  it('is disabled when the disabled prop is true', () => {
    render(<Textarea placeholder="Enter notes" disabled />);
    const textarea = screen.getByPlaceholderText('Enter notes');
    expect(textarea).toBeDisabled();
  });
});
