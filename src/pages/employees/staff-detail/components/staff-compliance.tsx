import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useStaffComplianceSummary } from '@/hooks/use-staff';
import { StaffPendingChanges } from '@/models/staff-pending-changes';
import { differenceInDays, parseISO } from 'date-fns';

interface StaffComplianceSectionProps {
  staffId?: string;
  canEdit: boolean;
  pendingChanges?: StaffPendingChanges;
  onPendingChangesChange?: (changes: StaffPendingChanges) => void;
}

function calculateComplianceStatus(expiryDate?: string | null): 'Complete' | 'Expiring Soon' | 'Expired' {
  if (!expiryDate) return 'Complete';

  const today = new Date();
  const expiry = parseISO(expiryDate);
  const daysUntilExpiry = differenceInDays(expiry, today);

  if (daysUntilExpiry < 0) return 'Expired';
  if (daysUntilExpiry <= 30) return 'Expiring Soon';
  return 'Complete';
}

function getStatusBadgeVariant(status: 'Complete' | 'Expiring Soon' | 'Expired'): "success" | "warning" | "destructive" {
  switch (status) {
    case 'Complete':
      return 'success';
    case 'Expiring Soon':
      return 'warning';
    case 'Expired':
      return 'destructive';
  }
}

export function StaffComplianceSection({ 
  staffId,
  canEdit,
  pendingChanges,
  onPendingChangesChange
}: StaffComplianceSectionProps) {
  const { data: summary = [], loading } = useStaffComplianceSummary(staffId);

  // Reconcile required compliance types, actual records, and pending changes.
  // Primary key for matching is compliance_type_id (UUID). compliance_name is
  // retained only as a display label and for DB write-back (audit trigger compat).
  const resolvedItems = useMemo(() => {
    return summary.map((row) => {
      const reqId = row.compliance_type_id;

      const pendingAdd = pendingChanges?.staffCompliance?.toAdd.find(
        (c) => c.compliance_type_id === reqId
      );
      const pendingUpdate = pendingChanges?.staffCompliance?.toUpdate.find(
        (c) => c.compliance_type_id === reqId
      );
      const isPendingDelete = row.record_id
        ? pendingChanges?.staffCompliance?.toDelete.includes(row.record_id)
        : false;

      let isCompleted = !!row.record_id;
      let expiryDate = row.expiry_date || '';
      let isTemp = false;

      if (pendingAdd) {
        isCompleted = true;
        expiryDate = pendingAdd.expiry_date || '';
        isTemp = true;
      } else if (isPendingDelete) {
        isCompleted = false;
        expiryDate = '';
      } else if (pendingUpdate) {
        isCompleted = true;
        expiryDate = pendingUpdate.expiry_date || '';
      }

      const status = isCompleted ? calculateComplianceStatus(expiryDate) : null;

      return {
        requirementId: reqId,
        recordId: row.record_id,
        complianceName: row.compliance_name,
        description: row.compliance_desc,
        isCompleted,
        expiryDate,
        status,
        isTemp,
        isPendingDelete,
        isPendingUpdate: !!pendingUpdate,
      };
    });
  }, [summary, pendingChanges]);

  const handleCheckboxChange = (reqId: string, recordId: string | null, complianceName: string, checked: boolean) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const pendingAdd = pendingChanges.staffCompliance.toAdd.find(
      (c) => c.compliance_type_id === reqId
    );

    if (checked) {
      // Undo deletion if it was pending delete
      if (recordId && pendingChanges.staffCompliance.toDelete.includes(recordId)) {
        onPendingChangesChange({
          ...pendingChanges,
          staffCompliance: {
            ...pendingChanges.staffCompliance,
            toDelete: pendingChanges.staffCompliance.toDelete.filter((id) => id !== recordId)
          }
        });
        return;
      }

      // If already complete, do nothing
      if (recordId || pendingAdd) return;

      // Add to toAdd
      onPendingChangesChange({
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toAdd: [
            ...pendingChanges.staffCompliance.toAdd,
            {
              compliance_type_id: reqId,
              compliance_name: complianceName,
              status: 'Complete',
              expiry_date: null
            }
          ]
        }
      });
    } else {
      // Uncheck / mark for removal
      if (pendingAdd) {
        onPendingChangesChange({
          ...pendingChanges,
          staffCompliance: {
            ...pendingChanges.staffCompliance,
            toAdd: pendingChanges.staffCompliance.toAdd.filter(
              (c) => c.compliance_type_id !== reqId
            )
          }
        });
      } else if (recordId) {
        onPendingChangesChange({
          ...pendingChanges,
          staffCompliance: {
            ...pendingChanges.staffCompliance,
            toUpdate: pendingChanges.staffCompliance.toUpdate.filter((c) => c.id !== recordId),
            toDelete: [...pendingChanges.staffCompliance.toDelete, recordId]
          }
        });
      }
    }
  };

  const handleExpiryChange = (reqId: string, recordId: string | null, complianceName: string, value: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const pendingAdd = pendingChanges.staffCompliance.toAdd.find(
      (c) => c.compliance_type_id === reqId
    );
    const expiryDate = value || null;

    if (pendingAdd) {
      onPendingChangesChange({
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toAdd: pendingChanges.staffCompliance.toAdd.map((c) =>
            c.compliance_type_id === reqId ? { ...c, expiry_date: expiryDate } : c
          )
        }
      });
    } else if (recordId) {
      const existingUpdate = pendingChanges.staffCompliance.toUpdate.find(
        (c) => c.id === recordId
      );
      let toUpdate = [];

      if (existingUpdate) {
        toUpdate = pendingChanges.staffCompliance.toUpdate.map((c) =>
          c.id === recordId ? { ...c, expiry_date: expiryDate } : c
        );
      } else {
        const summaryItem = summary.find(r => r.compliance_type_id === reqId);
        toUpdate = [
          ...pendingChanges.staffCompliance.toUpdate,
          {
            id: recordId,
            compliance_type_id: reqId,
            compliance_name: complianceName,
            status: summaryItem?.record_status || 'Complete',
            expiry_date: expiryDate
          }
        ];
      }

      onPendingChangesChange({
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toUpdate
        }
      });
    } else {
      // Auto-complete the item when setting an expiry date
      onPendingChangesChange({
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toAdd: [
            ...pendingChanges.staffCompliance.toAdd,
            {
              compliance_type_id: reqId,
              compliance_name: complianceName,
              status: 'Complete',
              expiry_date: expiryDate
            }
          ]
        }
      });
    }
  };

  return (
    <Card className="pb-2.5" id="staff_compliance">
      <CardHeader>
        <CardTitle>Compliance</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading compliance requirements...</div>
        ) : resolvedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No compliance requirements configured for this staff member's assigned houses.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/60">
                <TableHead className="text-start text-secondary-foreground font-normal min-w-[250px] h-10">
                  Requirement
                </TableHead>
                <TableHead className="min-w-24 text-secondary-foreground font-normal text-center h-10">
                  Completed
                </TableHead>
                <TableHead className="min-w-[180px] text-secondary-foreground font-normal text-center h-10">
                  Expiry Date
                </TableHead>
                <TableHead className="min-w-[120px] text-secondary-foreground font-normal text-center h-10">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-mono font-medium">
              {resolvedItems.map((item) => {
                const isPendingAdd = item.isTemp;
                const isPendingUpdate = item.isPendingUpdate;
                const isPendingDelete = item.isPendingDelete;

                return (
                  <TableRow 
                    key={item.requirementId}
                    className={
                      isPendingAdd ? 'bg-primary/5' :
                      isPendingDelete ? 'opacity-50 bg-destructive/5' :
                      isPendingUpdate ? 'bg-warning/5' : ''
                    }
                  >
                    <TableCell className="py-5.5!">
                      <div className="flex flex-col">
                        <span className={isPendingDelete ? 'line-through text-muted-foreground' : ''}>
                          {item.complianceName}
                        </span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground font-normal">
                            {item.description}
                          </span>
                        )}
                        {(isPendingAdd || isPendingUpdate || isPendingDelete) && (
                          <span className={`text-[10px] flex items-center gap-1 mt-0.5 ${
                            isPendingAdd ? 'text-primary' : isPendingUpdate ? 'text-warning' : 'text-destructive'
                          }`}>
                            Pending {isPendingAdd ? 'add' : isPendingUpdate ? 'update' : 'removal'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-5.5! text-center">
                      <Checkbox
                        id={`check-${item.requirementId}`}
                        checked={item.isCompleted}
                        onCheckedChange={(checked) => handleCheckboxChange(item.requirementId, item.recordId, item.complianceName, checked as boolean)}
                        disabled={!canEdit}
                      />
                    </TableCell>
                    <TableCell className="py-5.5! text-center">
                      <Input
                        id={`expiry-${item.requirementId}`}
                        type="date"
                        value={item.expiryDate || ''}
                        onChange={(e) => handleExpiryChange(item.requirementId, item.recordId, item.complianceName, e.target.value)}
                        disabled={!canEdit || (!item.isCompleted && !item.expiryDate)}
                        className="max-w-[160px] mx-auto"
                      />
                    </TableCell>
                    <TableCell className="py-5.5! text-center">
                      {item.isCompleted ? (
                        <Badge variant={getStatusBadgeVariant(item.status!)} size="sm">
                          {item.status}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" size="sm" className="bg-gray-100 text-gray-500 border-gray-200">
                          Incomplete
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
