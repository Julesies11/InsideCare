import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { MedicationRegisterPage } from '@/pages/participants/medication-register/medication-register-page';
import { MedicationDetailPage } from '@/pages/participants/medication-register/medication-detail-page';
import { ROUTES } from '@/config/routes.config';
import { Route, Routes } from 'react-router';

// Mock the hooks
vi.mock('@/hooks/use-medications-master', () => ({
  useMedicationsMaster: () => ({
    medications: [],
    count: 0,
    isLoading: false,
    refresh: vi.fn(),
  }),
  useMedicationTypes: () => ({
    data: [
      { id: '1', medication_type_name: 'Type 1', is_active: true },
      { id: '2', medication_type_name: 'Type 2', is_active: false },
    ],
    isLoading: false,
  }),
  useMedicationMaster: () => ({
    data: { id: 'm1', medication_name: 'Test Med', type_id: '1', is_active: true },
    isLoading: false,
  }),
  useAddMedicationMaster: () => ({ mutateAsync: vi.fn() }),
  useUpdateMedicationMaster: () => ({ mutateAsync: vi.fn() }),
  useAddMedicationType: () => ({ mutateAsync: vi.fn() }),
  useUpdateMedicationType: () => ({ mutateAsync: vi.fn() }),
}));

describe('Medications Smoke Tests', () => {
  it('MedicationRegisterPage renders without crashing', async () => {
    renderWithProviders(<MedicationRegisterPage />, { route: ROUTES.MEDICATION_REGISTER });
    expect(screen.getByText(/Medication Register/i)).toBeInTheDocument();
  });

  it('MedicationDetailPage renders without crashing for a new medication', async () => {
    renderWithProviders(
      <Routes>
        <Route path={`${ROUTES.MEDICATION_REGISTER}/:id`} element={<MedicationDetailPage />} />
      </Routes>,
      { route: `${ROUTES.MEDICATION_REGISTER}/new` }
    );
    await waitFor(() => {
      expect(screen.getByText(/Add Medication/i)).toBeInTheDocument();
    });
  });
});
