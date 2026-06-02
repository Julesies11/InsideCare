import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StaffTrainingSection } from './staff-training';
import { ReactNode } from 'react';

// Mock the hook
vi.mock('@/hooks/use-staff', () => ({
  useStaffTraining: vi.fn(() => ({
    training: [],
    loading: false,
    refresh: vi.fn(),
  })),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  </MemoryRouter>
);

describe('StaffTrainingSection Smoke Test', () => {
  it('renders without crashing', () => {
    render(
      <StaffTrainingSection 
        staffId="test-staff-id" 
        canEdit={true} 
      />, 
      { wrapper }
    );
    expect(screen.getByText(/^Training$/i)).toBeDefined();
  });
});
