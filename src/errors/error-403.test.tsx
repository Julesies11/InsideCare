import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Error403 } from './error-403';
import { BrowserRouter } from 'react-router';

describe('Error403', () => {
  it('renders correctly', () => {
    render(
      <BrowserRouter>
        <Error403 />
      </BrowserRouter>
    );

    expect(screen.getByText(/403 Access Denied/i)).toBeInTheDocument();
    expect(screen.getByText(/You don't have permission to access this page/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return Home/i })).toBeInTheDocument();
  });
});
