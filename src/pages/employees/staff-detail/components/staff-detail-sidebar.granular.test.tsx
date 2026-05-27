import { render, screen } from '@testing-library/react';
import { StaffDetailSidebar } from './staff-detail-sidebar';
import { useRBAC } from '@/hooks/useRBAC';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';

// Mock useRBAC
vi.mock('@/hooks/useRBAC', () => ({
  useRBAC: vi.fn(),
  ACCESS_LEVEL: {
    FULL: 'full',
    CONTEXT_READ_WRITE: 'context_read_write',
    CONTEXT_READ_ONLY: 'context_read_only',
    READ_ONLY: 'read_only',
    NONE: 'none',
  },
}));

describe('StaffDetailSidebar Granular RBAC', () => {
  const mockHasAccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRBAC as any).mockReturnValue({ hasAccess: mockHasAccess });
  });

  it('renders all items when user has full access', () => {
    mockHasAccess.mockReturnValue(true);

    render(
      <MemoryRouter>
        <StaffDetailSidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    expect(screen.getByText('Employment Details')).toBeInTheDocument();
    expect(screen.getByText('Availability')).toBeInTheDocument();
    expect(screen.getByText('Emergency Contact')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
    expect(screen.getByText('Training')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Roster')).toBeInTheDocument();
    expect(screen.getByText('Leave')).toBeInTheDocument();
    expect(screen.getByText('Warnings')).toBeInTheDocument();
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
  });

  it('hides specific items when access is denied', () => {
    mockHasAccess.mockImplementation(({ resource }) => {
      // Deny access to compliance and training
      if (resource === 'staff_compliance' || resource === 'staff_training') return false;
      return true;
    });

    render(
      <MemoryRouter>
        <StaffDetailSidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    expect(screen.queryByText('Compliance')).not.toBeInTheDocument();
    expect(screen.queryByText('Training')).not.toBeInTheDocument();
    expect(screen.getByText('Employment Details')).toBeInTheDocument();
  });

  it('only shows Personal Details if all granular staff permissions are none', () => {
    mockHasAccess.mockImplementation(({ resource }) => {
      return resource === 'employees';
    });

    render(
      <MemoryRouter>
        <StaffDetailSidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    expect(screen.queryByText('Employment Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Compliance')).not.toBeInTheDocument();
    expect(screen.queryByText('Activity Log')).not.toBeInTheDocument();
  });
});
