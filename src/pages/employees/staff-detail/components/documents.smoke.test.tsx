import { AuthContext } from '@/auth/context/auth-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Documents } from './documents';

// Mock Hooks
vi.mock('@/hooks/use-staff-documents', () => ({
  useStaffDocuments: vi.fn(() => ({
    data: [
      {
        id: '1',
        file_name: 'Test Staff Doc',
        file_path: 'staff-1/documents/test.pdf',
        staff_id: 'staff-1',
      },
    ],
    isLoading: false,
  })),
  getStaffFileUrl: vi.fn(() => Promise.resolve('https://test.com')),
  useUpdateStaffDocument: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock('@/hooks/use-roles', () => ({
  useRoles: vi.fn(() => ({ roles: [] })),
}));

vi.mock('@/hooks/use-role-permissions', () => ({
  useAllRolePermissions: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/hooks/use-staff-document-role-permissions', () => ({
  useStaffDocumentRolePermissions: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useAllStaffDocumentOverrides: vi.fn(() => ({ data: [], isLoading: false })),
  useUpdateStaffDocumentRolePermissions: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
}));

vi.mock('@/hooks/useRBAC', () => ({
  useRBAC: vi.fn(() => ({ isAdmin: true, hasAccess: vi.fn(() => true) })),
  ACCESS_LEVEL: {
    FULL: 'full',
    NONE: 'none',
    CONTEXT_READ_ONLY: 'context_read_only',
    READ_ONLY: 'read_only',
  },
}));

vi.mock('@/hooks/use-file-upload', () => ({
  useFileUpload: vi.fn(() => [
    { isDragging: false, errors: [], files: [] },
    {
      removeFile: vi.fn(),
      clearFiles: vi.fn(),
      handleDragEnter: vi.fn(),
      handleDragLeave: vi.fn(),
      handleDragOver: vi.fn(),
      handleDrop: vi.fn(),
      openFileDialog: vi.fn(),
      getInputProps: vi.fn(() => ({})),
    },
  ]),
  formatBytes: vi.fn((bytes) => `${bytes} B`),
}));

const mockAuthValue = {
  user: {
    id: '1',
    fullname: 'Admin',
    email: 'admin@test.com',
    role_name: 'Admin',
    permissions: {},
  },
  isAdmin: true,
  isLoading: false,
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  impersonate: vi.fn(),
  stopImpersonating: vi.fn(),
  isImpersonating: false,
  checkPermission: vi.fn(() => true),
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={mockAuthValue as any}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

describe('Staff Documents Smoke Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the documents card', () => {
    render(<Documents staffId="staff-1" canAdd={true} canDelete={true} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Documents')).toBeDefined();
    expect(screen.getByText('Upload Document')).toBeDefined();
  });

  it('opens the upload sheet when clicking upload', async () => {
    render(<Documents staffId="staff-1" canAdd={true} canDelete={true} />, {
      wrapper: createWrapper(),
    });

    const uploadButton = screen.getByText('Upload Document');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Upload Documents')).toBeDefined();
      expect(
        screen.getByText(
          'Drag and drop files here or click to browse. Multiple files supported.',
        ),
      ).toBeDefined();
    });
  });

  it('allows switching between grid and table views for Admins', () => {
    render(<Documents staffId="staff-1" canAdd={true} canDelete={true} />, {
      wrapper: createWrapper(),
    });

    // Default view is grid, table headers shouldn't be present
    expect(screen.queryByText('Document Name')).toBeNull();

    // Click Table View toggle
    const tableToggle = screen.getByTitle('Table View (Admin Only)');
    fireEvent.click(tableToggle);

    // Table should now be visible
    expect(screen.getByText('Document Name')).toBeDefined();
    expect(screen.getByText('Access Control')).toBeDefined();

    // Switch back to Grid
    const gridToggle = screen.getByTitle('Grid View');
    fireEvent.click(gridToggle);

    expect(screen.queryByText('Document Name')).toBeNull();
  });

  it('triggers document view on single click', async () => {
    // We need to mock window.open
    const windowOpenSpy = vi
      .spyOn(window, 'open')
      .mockImplementation(() => null);

    render(<Documents staffId="staff-1" canAdd={true} canDelete={true} />, {
      wrapper: createWrapper(),
    });

    // Find the document card (it should have the filename)
    const docCard = screen.getByText('Test Staff Doc').closest('div');
    if (!docCard) throw new Error('Document card not found');

    // Click it
    fireEvent.click(docCard);

    await waitFor(() => {
      expect(windowOpenSpy).toHaveBeenCalled();
    });

    windowOpenSpy.mockRestore();
  });
});
