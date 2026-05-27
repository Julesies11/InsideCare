import { render, screen } from '@testing-library/react';
import { ParticipantDetailSidebar } from './participant-detail-sidebar';
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

describe('ParticipantDetailSidebar Granular RBAC', () => {
  const mockHasAccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRBAC as any).mockReturnValue({ hasAccess: mockHasAccess });
  });

  it('renders all bold parent items when user has full access', () => {
    mockHasAccess.mockReturnValue(true);

    render(
      <MemoryRouter>
        <ParticipantDetailSidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Behaviour & Support')).toBeInTheDocument();
    expect(screen.getByText('Support Needs')).toBeInTheDocument();
    expect(screen.getByText('Mealtime Management')).toBeInTheDocument();
    expect(screen.getByText('Medical Routine')).toBeInTheDocument();
    expect(screen.getByText('Medications')).toBeInTheDocument();
    expect(screen.getByText('Emergency Management')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Shift Notes')).toBeInTheDocument();
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
  });

  it('hides specific sections when access is denied', () => {
    mockHasAccess.mockImplementation(({ resource }) => {
      // Deny access to Goals and Medications
      if (resource === 'participant_goals' || resource === 'participant_medications') return false;
      return true;
    });

    render(
      <MemoryRouter>
        <ParticipantDetailSidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    expect(screen.queryByText('Goals')).not.toBeInTheDocument();
    expect(screen.queryByText('Medications')).not.toBeInTheDocument();
    expect(screen.getByText('Support Needs')).toBeInTheDocument();
  });

  it('only shows Personal Details if all granular participant permissions are none', () => {
    mockHasAccess.mockImplementation(({ resource }) => {
      return resource === 'participants';
    });

    render(
      <MemoryRouter>
        <ParticipantDetailSidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    expect(screen.queryByText('Goals')).not.toBeInTheDocument();
    expect(screen.queryByText('Support Needs')).not.toBeInTheDocument();
    expect(screen.queryByText('Activity Log')).not.toBeInTheDocument();
  });
});
