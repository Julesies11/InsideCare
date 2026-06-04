import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MedicationCombobox } from './medication-combobox';
import { useMedicationsMaster } from '@/hooks/use-medications-master';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock the hook
vi.mock('@/hooks/use-medications-master', () => ({
  useMedicationsMaster: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const mockMedications = [
  { id: 'm1', medication_name: 'Med 1', brand_name: 'Brand 1', is_active: true },
  { id: 'm2', medication_name: 'Med 2', brand_name: 'Brand 2', is_active: false },
  { id: 'm3', medication_name: 'Med 3', brand_name: 'Brand 3', is_active: true },
];

describe('MedicationCombobox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useMedicationsMaster as any).mockReturnValue({
      medications: mockMedications,
      isLoading: false,
    });
  });

  it('should filter only active medications by default', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MedicationCombobox value="" onChange={() => {}} canEdit={true} />
      </QueryClientProvider>
    );

    // Open the combobox
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    // Med 1 and Med 3 are active. Med 2 is inactive.
    expect(screen.getByText('Med 1')).toBeInTheDocument();
    expect(screen.queryByText('Med 2')).not.toBeInTheDocument();
    expect(screen.getByText('Med 3')).toBeInTheDocument();
  });

  it('should show the currently selected medication even if it is inactive', async () => {
    // Value is 'm2' which is inactive
    render(
      <QueryClientProvider client={queryClient}>
        <MedicationCombobox value="m2" onChange={() => {}} canEdit={true} />
      </QueryClientProvider>
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    // Med 2 should now be in the document because it is selected
    // It appears twice: once in the trigger and once in the command list
    expect(screen.getAllByText('Med 2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Med 1')).toBeInTheDocument();
  });

  it('should call useMedicationsMaster with 1000 pageSize', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MedicationCombobox value="" onChange={() => {}} canEdit={true} />
      </QueryClientProvider>
    );

    expect(useMedicationsMaster).toHaveBeenCalledWith(0, 1000);
  });
});
