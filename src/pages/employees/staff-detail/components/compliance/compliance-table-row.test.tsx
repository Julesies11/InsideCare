import { ResolvedComplianceItem } from '@/models/compliance.types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComplianceTableRow } from './compliance-table-row';

describe('ComplianceTableRow', () => {
  const mockItem: ResolvedComplianceItem = {
    requirementId: 'req-1',
    recordId: 'rec-1',
    complianceName: 'Standard Requirement',
    description: 'Test description',
    attachmentApplicable: true,
    expiryDateApplicable: true,
    documentNumberApplicable: true,
    commentsApplicable: true,
    systemCategory: null,
    isCompleted: true,
    expiryDate: '2025-12-31',
    docNumber: 'REF-123',
    comments: 'Test comments',
    status: 'Complete',
    isTemp: false,
    isPendingDelete: false,
    isPendingUpdate: false,
    verifiedDocuments: [],
  };

  const mockProps = {
    staffId: 'staff-123',
    userName: 'John Doe',
    item: mockItem,
    canEdit: true,
    onToggle: vi.fn(),
    onFieldChange: vi.fn(),
    onAddAttachment: vi.fn(),
    onRemoveAttachment: vi.fn(),
    onOpenIDModal: vi.fn(),
    idDocumentTypes: [],
  };

  it('renders standard requirement correctly', () => {
    render(
      <table>
        <tbody>
          <ComplianceTableRow {...mockProps} />
        </tbody>
      </table>,
    );

    expect(screen.getByText('Standard Requirement')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('REF-123')).toBeInTheDocument();
  });

  it('identifies ID verification based on systemCategory', () => {
    const idItem = {
      ...mockItem,
      systemCategory: 'id_verification',
      complianceName: 'Any Name',
      isCompleted: false,
    };
    render(
      <table>
        <tbody>
          <ComplianceTableRow {...mockProps} item={idItem} />
        </tbody>
      </table>,
    );

    // Should show "Verify ID Documents" or similar ID logic button
    expect(screen.getByText(/Verify ID Documents/i)).toBeInTheDocument();
  });

  it('triggers onToggle when checkbox is clicked', () => {
    render(
      <table>
        <tbody>
          <ComplianceTableRow {...mockProps} />
        </tbody>
      </table>,
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockProps.onToggle).toHaveBeenCalledWith(
      'req-1',
      'rec-1',
      'Standard Requirement',
      false,
    );
  });
});
