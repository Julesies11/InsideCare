import { useCallback, useEffect } from 'react';
import { handleError } from '@/errors/error-handler';
import { StaffPendingChanges } from '@/models/staff-pending-changes';
import { useStaffOnboardingSummary } from '@/hooks/use-staff';
import { useStaffOnboardingState } from '@/hooks/use-staff-onboarding-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StaffOnboardingSectionProps {
  staffId?: string;
  canEdit: boolean;
  pendingChanges?: StaffPendingChanges;
  onPendingChangesChange?: (changes: StaffPendingChanges) => void;
}

export function StaffOnboardingSection({
  staffId,
  canEdit,
  pendingChanges,
  onPendingChangesChange,
}: StaffOnboardingSectionProps) {
  const {
    data: summary = [],
    isLoading,
    error,
  } = useStaffOnboardingSummary(staffId);

  useEffect(() => {
    if (error) {
      handleError(error, { title: 'Failed to load onboarding checklist' });
    }
  }, [error]);

  const { resolvedItems, toggleComplete, updateComments } = useStaffOnboardingState({
    summary,
    pendingChanges,
    onPendingChangesChange,
  });

  const handleToggle = useCallback(
    (itemId: string, recordId: string | null, currentVal: boolean) => {
      toggleComplete(itemId, recordId, currentVal);
    },
    [toggleComplete],
  );

  const handleCommentChange = useCallback(
    (itemId: string, recordId: string | null, value: string) => {
      updateComments(itemId, recordId, value);
    },
    [updateComments],
  );

  return (
    <Card className="pb-2.5 shadow-xs border-slate-200" id="staff_onboarding">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-5">
        <CardTitle className="text-lg">Onboarding Checklist</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm animate-pulse">
            Loading onboarding items...
          </div>
        ) : error ? (
          <div className="p-6 m-6 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-sm text-red-700 font-medium">
              Failed to load onboarding data
            </p>
          </div>
        ) : resolvedItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm bg-slate-50/50 m-6 rounded-xl border border-dashed border-slate-200">
            No onboarding items configured.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-[50px] text-center border-b border-slate-200">
                    Done
                  </TableHead>
                  <TableHead className="text-start text-slate-500 font-bold uppercase tracking-wider text-[11px] min-w-[250px] px-4 h-11 border-b border-slate-200">
                    Task
                  </TableHead>
                  <TableHead className="text-start text-slate-500 font-bold uppercase tracking-wider text-[11px] px-4 h-11 border-b border-slate-200">
                    Comments
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-sm font-medium">
                {resolvedItems.map((item) => (
                  <TableRow
                    key={item.itemId}
                    className={item.isComplete ? 'bg-emerald-50/30' : ''}
                  >
                    <TableCell className="text-center py-4">
                      <Checkbox
                        checked={item.isComplete}
                        onCheckedChange={() =>
                          handleToggle(item.itemId, item.recordId, item.isComplete)
                        }
                        disabled={!canEdit}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-700 font-semibold">
                          {item.itemName}
                        </span>
                        {item.description && (
                          <span className="text-slate-500 text-xs mt-1">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Input
                        value={item.comments}
                        onChange={(e) =>
                          handleCommentChange(
                            item.itemId,
                            item.recordId,
                            e.target.value,
                          )
                        }
                        placeholder="Add comments..."
                        className="bg-white"
                        disabled={!canEdit}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
