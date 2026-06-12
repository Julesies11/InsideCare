import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it } from 'vitest';
import { StaffQualificationsSection } from './staff-qualifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('StaffQualificationsSection Smoke Test', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <StaffQualificationsSection staffId="test-id" canEdit={true} />
        </QueryClientProvider>
      </MemoryRouter>,
    );
  });
});
