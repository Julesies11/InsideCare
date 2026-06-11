import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import {
  useAddComplianceType,
  useAddIDDocumentType,
  useComplianceTypes,
  useDeleteIDDocumentType,
  useIDDocumentTypes,
  useUpdateComplianceType,
  useUpdateIDDocumentType,
} from '@/hooks/use-staff';
import { ComplianceSettingsPage } from './compliance-settings-page';

// Mock the hooks
vi.mock('@/hooks/use-staff', () => ({
  useComplianceTypes: vi.fn(),
  useAddComplianceType: vi.fn(),
  useUpdateComplianceType: vi.fn(),
  useIDDocumentTypes: vi.fn(),
  useAddIDDocumentType: vi.fn(),
  useUpdateIDDocumentType: vi.fn(),
  useDeleteIDDocumentType: vi.fn(),
}));

vi.mock('@/providers/settings-provider', () => ({
  useSettings: vi.fn(() => ({
    settings: {
      container: 'fixed',
    },
  })),
}));

describe('ComplianceSettingsPage Smoke Test', () => {
  it('renders the compliance settings page correctly', () => {
    // Setup mock data
    (useComplianceTypes as any).mockReturnValue({
      types: [],
      isLoading: false,
      refetch: vi.fn(),
    });
    (useIDDocumentTypes as any).mockReturnValue({
      idDocumentTypes: [],
      isLoading: false,
      refetch: vi.fn(),
    });
    (useAddComplianceType as any).mockReturnValue({ mutateAsync: vi.fn() });
    (useUpdateComplianceType as any).mockReturnValue({ mutateAsync: vi.fn() });
    (useAddIDDocumentType as any).mockReturnValue({ mutateAsync: vi.fn() });
    (useUpdateIDDocumentType as any).mockReturnValue({ mutateAsync: vi.fn() });
    (useDeleteIDDocumentType as any).mockReturnValue({ mutateAsync: vi.fn() });

    render(
      <MemoryRouter>
        <ComplianceSettingsPage />
      </MemoryRouter>,
    );

    // Basic checks
    expect(screen.getByText(/Compliance Settings/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Add Compliance Type/i).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText(/Compliance Master List/i)).toBeInTheDocument();
    expect(screen.getByText(/100 Points of ID Config/i)).toBeInTheDocument();
  });
});
