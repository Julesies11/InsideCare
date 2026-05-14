import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RolePermissionsMatrix } from './role-permissions-matrix';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('RolePermissionsMatrix', () => {
  it('renders the matrix with roles and modules', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RolePermissionsMatrix />
      </QueryClientProvider>
    );

    // Should show loading state initially
    expect(screen.getByText(/Loading permissions matrix.../i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Participant Profiles')).toBeInTheDocument();
    });

    // In single role view, the selected role should be visible in the Select trigger
    expect(screen.getByText('Admin')).toBeInTheDocument();
    
    // Support Worker should not be directly visible in the table header anymore
    expect(screen.queryByRole('columnheader', { name: 'Support Worker' })).not.toBeInTheDocument();

    // Check for access level labels in headers
    expect(screen.getByText('Full Access')).toBeInTheDocument();
    expect(screen.getByText('See module for context')).toBeInTheDocument();
  });
});
