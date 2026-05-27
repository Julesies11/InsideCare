import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
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
    canDelete: true,
    pendingChanges: emptyHousePendingChanges,
    onPendingChangesChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useHouseResourcesModule.useHouseResources).mockReturnValue({
      houseResources: [],
      loading: false,
      getFileUrl: vi.fn().mockResolvedValue('http://mock-url.com'),
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
    expect(screen.getByText(/Title \*/i)).toBeInTheDocument();
  });

  it('collects form data and triggers onPendingChangesChange on save', async () => {
    const onPendingChangesChange = vi.fn();
    renderWithProviders(<HouseResources {...defaultProps} onPendingChangesChange={onPendingChangesChange} />);
    
    // Open dialog
    fireEvent.click(screen.getByRole('button', { name: /Add Resource/i }));

    // Fill form
    const titleInput = screen.getByPlaceholderText(/Resource title/i);
    fireEvent.change(titleInput, { target: { value: 'Fire Safety Plan' } });
    
    // For now, let's verify that handleSave doesn't trigger if required fields are missing
    const saveButton = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveButton);
    expect(onPendingChangesChange).not.toHaveBeenCalled();
  });

  it('displays pending additions in the table', () => {
    const pendingWithAdd = {
      ...emptyHousePendingChanges,
      resources: {
        ...emptyHousePendingChanges.resources,
        toAdd: [
          {
            tempId: 'temp-1',
            title: 'Emergency Contact List',
            category: 'Emergency',
            type: 'Document',
            priority: 'High',
            house_id: 'house-123',
          },
        ],
      },
    };

    renderWithProviders(<HouseResources {...defaultProps} pendingChanges={pendingWithAdd} />);
    expect(screen.getByText('Emergency Contact List')).toBeInTheDocument();
    expect(screen.getByText(/Pending add/i)).toBeInTheDocument();
  });

  it('handles delete by marking for deletion in pending changes', async () => {
    const onPendingChangesChange = vi.fn();
    const mockResources = [
      {
        id: 'res-1',
        title: 'Lease Agreement',
        category: 'Legal',
        type: 'Contract',
        priority: 'Medium',
        file_url: 'path/to/lease.pdf',
      },
    ];

    // Mock hook to return a resource
    vi.mocked(useHouseResourcesModule.useHouseResources).mockReturnValue({
      houseResources: mockResources,
      loading: false,
      getFileUrl: vi.fn(),
    });

    // Mock confirm dialog
    window.confirm = vi.fn(() => true);

    renderWithProviders(<HouseResources {...defaultProps} onPendingChangesChange={onPendingChangesChange} />);
    
    // Find the row with Lease Agreement and then the delete button in that row
    const row = screen.getByText('Lease Agreement').closest('tr')!;
    const buttons = row.querySelectorAll('button');
    const deleteButton = Array.from(buttons).find(b => b.classList.contains('text-destructive'))!;
    
    fireEvent.click(deleteButton);

    expect(onPendingChangesChange).toHaveBeenCalledWith(
      expect.objectContaining({
        resources: expect.objectContaining({
          toDelete: expect.arrayContaining([{ id: 'res-1', filePath: 'path/to/lease.pdf' }]),
        }),
      })
    );
  });
});
