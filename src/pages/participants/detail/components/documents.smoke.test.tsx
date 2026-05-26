import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Documents } from './documents';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthContext } from '@/auth/context/auth-context';

// Mock Hooks
vi.mock('@/hooks/use-participant-documents', () => ({
  useParticipantDocuments: vi.fn(() => ({ data: [], isLoading: false })),
  getParticipantFileUrl: vi.fn(() => Promise.resolve('https://test.com')),
  useUpdateParticipantDocument: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock('@/hooks/use-roles', () => ({
  useRoles: vi.fn(() => ({ roles: [] })),
}));

vi.mock('@/hooks/use-document-role-permissions', () => ({
  useDocumentRolePermissions: vi.fn(() => ({ data: [], isLoading: false })),
  useUpdateDocumentRolePermissions: vi.fn(() => ({ mutateAsync: vi.fn() })),
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
  user: { id: '1', fullname: 'Admin', email: 'admin@test.com', role_name: 'Admin', permissions: {} },
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

describe('Documents Smoke Test', () => {
  it('renders the documents card', () => {
    render(<Documents participantId="part-1" canAdd={true} canDelete={true} canEdit={true} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Documents')).toBeDefined();
    expect(screen.getByText('Upload Document')).toBeDefined();
  });

  it('opens the upload sheet when clicking upload', async () => {
    render(<Documents participantId="part-1" canAdd={true} canDelete={true} canEdit={true} />, {
      wrapper: createWrapper(),
    });

    const uploadButton = screen.getByText('Upload Document');
    fireEvent.click(uploadButton);

    expect(screen.getByText('Upload Documents')).toBeDefined();
    expect(screen.getByText('Drag and drop files here or click to browse. Multiple files supported.')).toBeDefined();
  });
});
