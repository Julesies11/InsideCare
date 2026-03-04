import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  Alert, 
  AlertContent, 
  AlertDescription, 
  AlertIcon, 
  AlertTitle 
} from './alert';

describe('Alert', () => {
  it('renders correctly with children', () => {
    render(
      <Alert>
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Your action was completed.</AlertDescription>
      </Alert>
    );
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Your action was completed.')).toBeInTheDocument();
  });

  it('renders with an icon', () => {
    render(
      <Alert>
        <AlertIcon data-testid="alert-icon">
          <svg />
        </AlertIcon>
        <AlertContent>
          <AlertTitle>Info</AlertTitle>
        </AlertContent>
      </Alert>
    );
    
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Alert close onClose={handleClose}>
        <AlertTitle>Closable Alert</AlertTitle>
      </Alert>
    );
    
    const closeButton = screen.getByLabelText('Dismiss');
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('applies the correct variant classes', () => {
    const { rerender } = render(
      <Alert variant="destructive" appearance="solid">
        <AlertTitle>Error</AlertTitle>
      </Alert>
    );
    
    let alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-destructive');

    rerender(
      <Alert variant="success" appearance="solid">
        <AlertTitle>Success</AlertTitle>
      </Alert>
    );
    alert = screen.getByRole('alert');
    // From alert.tsx: bg-[var(--color-success,var(--color-green-500))]
    expect(alert).toHaveClass('bg-[var(--color-success,var(--color-green-500))]');
  });

  it('applies the correct size classes', () => {
    const { rerender } = render(
      <Alert size="lg">
        <AlertTitle>Large Alert</AlertTitle>
      </Alert>
    );
    
    let alert = screen.getByRole('alert');
    expect(alert).toHaveClass('p-4');

    rerender(
      <Alert size="sm">
        <AlertTitle>Small Alert</AlertTitle>
      </Alert>
    );
    alert = screen.getByRole('alert');
    expect(alert).toHaveClass('px-3');
  });
});
