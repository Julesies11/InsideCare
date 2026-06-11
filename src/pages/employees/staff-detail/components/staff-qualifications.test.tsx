import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { StaffQualificationsSection } from './staff-qualifications';

// Mock the hook
vi.mock('@/hooks/use-staff', () => ({
  useStaffQualifications: vi.fn((staffId) => ({
    qualifications:
      staffId === 'test-staff-id'
        ? [
            {
              id: '1',
              title: 'Bachelor of Nursing',
              institution: 'University of Sydney',
              date_completed: '2025-01-01',
              expiry_date: '2030-01-01',
              file_name: 'degree.pdf',
              file_path: 'staff/1/degree.pdf',
            },
          ]
        : [],
    loading: false,
    refresh: vi.fn(),
  })),
}));

const createTestQueryClient = () =>
  new QueryClient({
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

describe('StaffQualificationsSection', () => {
  it('renders qualification records correctly', () => {
    render(<StaffQualificationsSection staffId="test-staff-id" canEdit={true} />, {
      wrapper,
    });

    expect(screen.getByText(/Bachelor of Nursing/i)).toBeDefined();
    expect(screen.getByText(/University of Sydney/i)).toBeDefined();
    expect(screen.getByText(/degree\.pdf/i)).toBeDefined();
  });

  it('shows empty state when no qualification records found', () => {
    render(<StaffQualificationsSection staffId="empty-staff" canEdit={true} />, {
      wrapper,
    });

    expect(screen.queryByText(/Bachelor of Nursing/i)).toBeNull();
    expect(screen.getByText(/No qualifications available/i)).toBeDefined();
  });
});
