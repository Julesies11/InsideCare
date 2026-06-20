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
    status: 'complete',
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
    onStatusChange: vi.fn(),
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

    // Toggle details to expand
    fireEvent.click(screen.getByText(/View \/ Edit Details/i));
    expect(screen.getByDisplayValue('REF-123')).toBeInTheDocument();
  });

  it('identifies ID verification based on systemCategory', () => {
    const idItem = {
      ...mockItem,
      systemCategory: 'id_verification',
      complianceName: 'Any Name',
      status: 'Missing',
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

  it('renders status buttons correctly', () => {
    render(
      <table>
        <tbody>
          <ComplianceTableRow {...mockProps} />
        </tbody>
      </table>,
    );

    expect(screen.getByTitle('Mark as Complete')).toBeInTheDocument();
    expect(screen.getByTitle('Mark as In Progress')).toBeInTheDocument();
    expect(screen.getByTitle('Mark as Not Applicable')).toBeInTheDocument();
  });

  it('renders N/A state correctly showing Reason field and no other fields', () => {
    const naItem: ResolvedComplianceItem = {
      ...mockItem,
      status: 'not_applicable',
      comments: 'Not needed for part-time',
    };

    render(
      <table>
        <tbody>
          <ComplianceTableRow {...mockProps} item={naItem} />
        </tbody>
      </table>,
    );

    // Toggle details to expand
    fireEvent.click(screen.getByText(/View \/ Edit Details/i));

    // Should show the reason block and the Textarea with the comments value
    expect(screen.getByText(/marked as Not Applicable/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Reason')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Not needed for part-time')).toBeInTheDocument();

    // Document number input field should not be rendered
    expect(screen.queryByPlaceholderText('e.g. LIC123456')).not.toBeInTheDocument();

    // Expiry date input field should not be rendered
    const inputs = screen.queryAllByRole('textbox');
    const dateInputs = inputs.filter(input => input.getAttribute('type') === 'date');
    expect(dateInputs.length).toBe(0);
  });
});
