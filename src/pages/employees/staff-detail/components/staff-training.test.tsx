import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StaffTrainingSection } from './staff-training';
import { ReactNode } from 'react';

// Mock the hook
vi.mock('@/hooks/use-staff', () => ({
  useStaffTraining: vi.fn((staffId) => ({
    training: staffId === 'test-staff-id' ? [
      {
        id: '1',
        title: 'First Aid',
        category: 'Safety',
        date_completed: '2025-01-01',
        expiry_date: '2026-01-01',
        provider: 'Red Cross',
        file_name: 'cert.pdf',
        file_path: 'staff/1/cert.pdf'
      }
    ] : [],
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

describe('StaffTrainingSection', () => {
  it('renders training records correctly', () => {
    render(
      <StaffTrainingSection 
        staffId="test-staff-id" 
        canEdit={true} 
      />, 
      { wrapper }
    );
    
    expect(screen.getByText(/First Aid/i)).toBeDefined();
    expect(screen.getByText(/Safety/i)).toBeDefined();
    expect(screen.getByText(/cert\.pdf/i)).toBeDefined();
  });

  it('shows empty state when no training records found', () => {
    render(
      <StaffTrainingSection 
        staffId="empty-staff" 
        canEdit={true} 
      />, 
      { wrapper }
    );
    
    expect(screen.queryByText(/First Aid/i)).toBeNull();
  });
});
