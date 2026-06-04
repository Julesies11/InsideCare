import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { HouseResources } from './house-resources';
import { renderWithProviders } from '@/test/test-utils';
import { emptyHousePendingChanges } from '@/models/house-pending-changes';
import * as useHouseResourcesModule from '@/hooks/useHouseResources';

// Mock the hooks
vi.mock('@/hooks/useHouseResources', () => ({
  useHouseResources: vi.fn(),
}));

vi.mock('@/auth/context/auth-context', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/auth/context/auth-context');
  return {
    ...actual,
    useAuth: vi.fn(() => ({
      user: { id: 'user-123' },
    })),
  };
});

describe('HouseResources Component', () => {
  const defaultProps = {
    houseId: 'house-123',
    canAdd: true,
    pendingChanges: emptyHousePendingChanges,
    onPendingChangesChange: vi.fn(),
  };

  const mockResources = [
    {
      id: 'res-1',
      house_id: 'house-123',
      title: 'Active Resource',
      category: 'Medical',
      type: 'Guideline',
      priority: 'Medium',
      is_active: true,
      file_url: 'path/1',
      file_name: 'doc1.pdf',
      created_at: '2026-06-01',
      updated_at: '2026-06-01'
    },
    {
      id: 'res-2',
      house_id: 'house-123',
      title: 'Inactive Resource',
      category: 'Other',
      type: 'Note',
      priority: 'Low',
      is_active: false,
      file_url: 'path/2',
      file_name: 'doc2.pdf',
      created_at: '2026-06-01',
      updated_at: '2026-06-01'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useHouseResourcesModule.useHouseResources).mockReturnValue({
      houseResources: [],
      loading: false,
      error: null,
      getFileUrl: vi.fn().mockResolvedValue('http://mock-url.com'),
      refetch: vi.fn(),
    });
  });

  it('renders the Resources card and empty state', () => {
    renderWithProviders(<HouseResources {...defaultProps} />);
    expect(screen.getAllByText(/Resources/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/No resources added yet/i)).toBeInTheDocument();
  });

  it('opens the dialog when Add Resource is clicked', async () => {
    renderWithProviders(<HouseResources {...defaultProps} />);
    const addButton = screen.getByRole('button', { name: /Add Resource/i });
    fireEvent.click(addButton);

    expect(screen.getByText(/Add a new resource for this house/i)).toBeInTheDocument();
  });

  it('filters inactive resources by default', () => {
    vi.mocked(useHouseResourcesModule.useHouseResources).mockReturnValue({
      houseResources: mockResources as any,
      loading: false,
      error: null,
      getFileUrl: vi.fn(),
      refetch: vi.fn(),
    });

    renderWithProviders(<HouseResources {...defaultProps} />);
    
    expect(screen.getByText('Active Resource')).toBeInTheDocument();
    expect(screen.queryByText('Inactive Resource')).not.toBeInTheDocument();
  });

  it('shows inactive resources when Active Only toggle is turned off', () => {
    vi.mocked(useHouseResourcesModule.useHouseResources).mockReturnValue({
      houseResources: mockResources as any,
      loading: false,
      error: null,
      getFileUrl: vi.fn(),
      refetch: vi.fn(),
    });

    renderWithProviders(<HouseResources {...defaultProps} />);
    
    const toggle = screen.getByLabelText(/Active Only/i);
    fireEvent.click(toggle);

    expect(screen.getByText('Active Resource')).toBeInTheDocument();
    expect(screen.getByText('Inactive Resource')).toBeInTheDocument();
  });

  it('opens edit dialog when resource title is clicked', () => {
    vi.mocked(useHouseResourcesModule.useHouseResources).mockReturnValue({
      houseResources: mockResources as any,
      loading: false,
      error: null,
      getFileUrl: vi.fn(),
      refetch: vi.fn(),
    });

    renderWithProviders(<HouseResources {...defaultProps} />);
    
    const titleButton = screen.getByText('Active Resource');
    fireEvent.click(titleButton);

    expect(screen.getByText(/Edit Resource/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Active Resource')).toBeInTheDocument();
  });

  it('toggles resource status in the edit dialog', () => {
    const onPendingChangesChange = vi.fn();
    vi.mocked(useHouseResourcesModule.useHouseResources).mockReturnValue({
      houseResources: [mockResources[0]] as any,
      loading: false,
      error: null,
      getFileUrl: vi.fn(),
      refetch: vi.fn(),
    });

    renderWithProviders(<HouseResources {...defaultProps} onPendingChangesChange={onPendingChangesChange} />);
    
    fireEvent.click(screen.getByText('Active Resource'));
    
    const statusToggle = screen.getByLabelText(/Resource Status/i);
    // It's checked initially because it's active
    expect(statusToggle).toBeChecked();
    
    fireEvent.click(statusToggle);
    expect(statusToggle).not.toBeChecked();
    
    fireEvent.click(screen.getByRole('button', { name: /Update Resource/i }));

    expect(onPendingChangesChange).toHaveBeenCalledWith(
      expect.objectContaining({
        resources: expect.objectContaining({
          toUpdate: expect.arrayContaining([
            expect.objectContaining({ id: 'res-1', is_active: false })
          ]),
        }),
      })
    );
  });

  it('merges pending changes when opening edit dialog', () => {
    vi.mocked(useHouseResourcesModule.useHouseResources).mockReturnValue({
      houseResources: [mockResources[0]] as any,
      loading: false,
      error: null,
      getFileUrl: vi.fn(),
      refetch: vi.fn(),
    });

    const pendingUpdate = {
      ...emptyHousePendingChanges,
      resources: {
        ...emptyHousePendingChanges.resources,
        toUpdate: [{ id: 'res-1', title: 'Updated Title' }]
      }
    };

    renderWithProviders(<HouseResources {...defaultProps} pendingChanges={pendingUpdate} />);
    
    // The table should show the updated title from pending changes
    fireEvent.click(screen.getByText('Updated Title'));

    // The dialog should also show the updated title
    expect(screen.getByDisplayValue('Updated Title')).toBeInTheDocument();
  });
});
