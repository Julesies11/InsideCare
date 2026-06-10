import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStaffComplianceState } from './use-staff-compliance-state';

vi.mock('@/api/staff-details.api', () => ({
  staffDetailsApi: {
    documents: {
      delete: vi.fn().mockResolvedValue(true),
    }
  }
}));

describe('useStaffComplianceState', () => {
  it('should correctly map a missing requirement to a ResolvedComplianceItem', () => {
    const summary = [
      {
        compliance_type_id: 'type-1',
        compliance_name: 'First Aid',
        record_id: null,
        record_status: null,
        expiry_date: null,
        document_number: null,
        comments: null,
        verified_documents: null,
        system_category: 'standard',
        attachment_applicable: true,
        expiry_date_applicable: true,
        document_number_applicable: false,
        comments_applicable: false
      }
    ];

    const { result } = renderHook(() => useStaffComplianceState({ summary }));

    expect(result.current.resolvedItems).toHaveLength(1);
    expect(result.current.resolvedItems[0]).toEqual(expect.objectContaining({
      requirementId: 'type-1',
      isCompleted: false,
      status: null,
      systemCategory: 'standard'
    }));
  });

  it('should apply pendingAdd state over database summary', () => {
    const summary = [
      {
        compliance_type_id: 'type-1',
        compliance_name: 'First Aid',
        record_id: null,
      }
    ];

    const pendingChanges = {
      staffCompliance: {
        toAdd: [{
          compliance_type_id: 'type-1',
          compliance_name: 'First Aid',
          status: 'complete',
          expiry_date: '2030-01-01',
        }],
        toUpdate: [],
        toDelete: []
      }
    } as any;

    const { result } = renderHook(() => useStaffComplianceState({ summary, pendingChanges }));

    expect(result.current.resolvedItems[0]).toEqual(expect.objectContaining({
      isCompleted: true,
      expiryDate: '2030-01-01',
      isTemp: true
    }));
  });

  it('should trigger onPendingChangesChange when toggling a new requirement on', () => {
    const onPendingChangesChange = vi.fn();
    const summary = [{ compliance_type_id: 'type-1', compliance_name: 'First Aid', record_id: null }];
    const pendingChanges = { staffCompliance: { toAdd: [], toUpdate: [], toDelete: [] } } as any;

    const { result } = renderHook(() => useStaffComplianceState({ summary, pendingChanges, onPendingChangesChange }));

    act(() => {
      result.current.updateStatus('type-1', null, 'First Aid', 'complete');
    });

    expect(onPendingChangesChange).toHaveBeenCalledTimes(1);
    expect(onPendingChangesChange.mock.calls[0][0].staffCompliance.toAdd).toHaveLength(1);
    expect(onPendingChangesChange.mock.calls[0][0].staffCompliance.toAdd[0].compliance_type_id).toBe('type-1');
    expect(onPendingChangesChange.mock.calls[0][0].staffCompliance.toAdd[0].status).toBe('complete');
  });

  it('should correctly reconcile "not_applicable" status', () => {
    const summary = [
      {
        compliance_type_id: 'type-1',
        compliance_name: 'First Aid',
        record_id: 'record-1',
        record_status: 'not_applicable',
      }
    ];

    const { result } = renderHook(() => useStaffComplianceState({ summary }));

    expect(result.current.resolvedItems[0].status).toBe('not_applicable');
  });

  it('should correctly reconcile "in_progress" status', () => {
    const summary = [
      {
        compliance_type_id: 'type-1',
        compliance_name: 'First Aid',
        record_id: 'record-1',
        record_status: 'in_progress',
      }
    ];

    const { result } = renderHook(() => useStaffComplianceState({ summary }));

    expect(result.current.resolvedItems[0].status).toBe('in_progress');
  });

  it('should handle verifiedDocuments reconciliation', () => {
    const mockDocs = [{ document_type: 'passport', points: 70 }];
    const summary = [
      {
        compliance_type_id: 'type-1',
        compliance_name: 'ID Check',
        record_id: 'record-1',
        verified_documents: mockDocs
      }
    ];

    const { result } = renderHook(() => useStaffComplianceState({ summary }));

    expect(result.current.resolvedItems[0].verifiedDocuments).toEqual(mockDocs);
  });

  it('should calculate "Expired" status correctly', () => {
    const summary = [
      {
        compliance_type_id: 'type-1',
        compliance_name: 'Check',
        record_id: 'record-1',
        record_status: 'complete',
        expiry_date: '2020-01-01' // Long ago
      }
    ];

    const { result } = renderHook(() => useStaffComplianceState({ summary }));

    expect(result.current.resolvedItems[0].status).toBe('Expired');
  });

  it('should calculate "Expiring Soon" status correctly', () => {
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
    const expiryDate = fifteenDaysFromNow.toISOString().split('T')[0];

    const summary = [
      {
        compliance_type_id: 'type-1',
        compliance_name: 'Check',
        record_id: 'record-1',
        record_status: 'complete',
        expiry_date: expiryDate
      }
    ];

    const { result } = renderHook(() => useStaffComplianceState({ summary }));

    expect(result.current.resolvedItems[0].status).toBe('Expiring Soon');
  });
});
