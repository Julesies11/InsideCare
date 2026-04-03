import { render, screen, fireEvent } from '@testing-library/react';
import { StaffAvailability } from './staff-availability';
import { describe, it, expect, vi } from 'vitest';

describe('StaffAvailability', () => {
  const mockOnFormChange = vi.fn();

  it('renders the availability text correctly', () => {
    const formData = { availability: 'Monday to Friday, 9-5' };
    render(
      <StaffAvailability 
        formData={formData} 
        onFormChange={mockOnFormChange} 
        canEdit={true} 
      />
    );

    const textarea = screen.getByLabelText(/Availability Schedule/i);
    expect(textarea).toHaveValue('Monday to Friday, 9-5');
  });

  it('calls onFormChange when the text is updated', () => {
    const formData = { availability: '' };
    render(
      <StaffAvailability 
        formData={formData} 
        onFormChange={mockOnFormChange} 
        canEdit={true} 
      />
    );

    const textarea = screen.getByLabelText(/Availability Schedule/i);
    fireEvent.change(textarea, { target: { value: 'Weekends only' } });

    expect(mockOnFormChange).toHaveBeenCalledWith('availability', 'Weekends only');
  });

  it('is disabled when canEdit is false', () => {
    const formData = { availability: 'Test' };
    render(
      <StaffAvailability 
        formData={formData} 
        onFormChange={mockOnFormChange} 
        canEdit={false} 
      />
    );

    const textarea = screen.getByLabelText(/Availability Schedule/i);
    expect(textarea).toBeDisabled();
  });
});
