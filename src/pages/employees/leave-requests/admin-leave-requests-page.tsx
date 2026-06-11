import { Fragment, useCallback, useEffect, useState } from 'react';
import { rosterApi } from '@/api/roster.api';
import { useAuth } from '@/auth/context/auth-context';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { format } from 'date-fns';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Paperclip,
  X,
} from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ROUTES } from '@/config/routes.config';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { NotificationService } from '@/lib/notification-service';
import { ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTable } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { Textarea } from '@/components/ui/textarea';
import { Container } from '@/components/common/container';

const getInitials = (name?: string) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

interface LeaveRequest {
  id: string;
  staff_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  attachment_url: string | null;
  created_at: string;
  staff: {
    id: string;
    staff_name: string;
    photo_url: string | null;
    auth_user_id: string | null;
  } | null;
  leave_type: { leave_type_name: string } | null;
  conflict_count?: number;
}

interface AffectedShift {
  id: string;
  start_date: string;
  start_time: string;
  end_time: string;
  house: { house_name: string } | null;
}

export function AdminLeaveRequestsPage() {
  const { user } = useAuth();
  const { hasAccess } = useRBAC();

  const canEdit = hasAccess({
    resource: RBAC_MODULES.LEAVE_REQUESTS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [conflictCounts, setConflictCounts] = useState<Record<string, number>>(
    {},
  );
  const [affectedShifts, setAffectedShifts] = useState<AffectedShift[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(false);

  const statusVariant: Record<string, 'secondary' | 'success' | 'destructive'> =
    {
      pending: 'secondary',
      approved: 'success',
      rejected: 'destructive',
    };

  const statusLabel = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  const dayCount = (req: LeaveRequest) => {
    const ms =
      new Date(req.end_date).getTime() - new Date(req.start_date).getTime();
    return Math.round(ms / 86400000) + 1;
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const rows = (await rosterApi.listAdminLeaveRequests()) as LeaveRequest[];
      setRequests(rows);

      // Fetch conflict counts for all pending requests in a single bulk query
      const pending = rows.filter((r) => r.status === 'pending');
      if (pending.length > 0) {
        const staffIds = Array.from(new Set(pending.map((r) => r.staff_id)));
        const minDate = pending.reduce(
          (min, r) => (r.start_date < min ? r.start_date : min),
          pending[0].start_date,
        );
        const maxDate = pending.reduce(
          (max, r) => (r.end_date > max ? r.end_date : max),
          pending[0].end_date,
        );

        const allShifts = await rosterApi.listShiftsForStaffIds(
          staffIds,
          minDate,
          maxDate,
        );

        const counts: Record<string, number> = {};
        pending.forEach((req) => {
          const matches = (allShifts || []).filter(
            (s) =>
              s.staff_id === req.staff_id &&
              s.start_date >= req.start_date &&
              s.start_date <= req.end_date,
          );
          counts[req.id] = matches.length;
        });
        setConflictCounts(counts);
      }
    } catch (error) {
      console.error('Error loading leave requests:', error);
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const fetchAffectedShifts = async (
    staffId: string,
    startDate: string,
    endDate: string,
  ) => {
    setShiftsLoading(true);
    try {
      const data = await rosterApi.listConflictingShifts(
        staffId,
        startDate,
        endDate,
      );
      setAffectedShifts((data as AffectedShift[]) || []);
    } catch (err) {
      console.error('Error fetching affected shifts:', err);
    } finally {
      setShiftsLoading(false);
    }
  };

  const openAction = (req: LeaveRequest, type: 'approve' | 'reject') => {
    setSelected(req);
    setAction(type);
    setAdminNotes('');
    if (type === 'approve') {
      fetchAffectedShifts(req.staff_id, req.start_date, req.end_date);
    } else {
      setAffectedShifts([]);
    }
  };

  const handleAction = async () => {
    if (!selected || !action || !user) return;
    setSaving(true);
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    try {
      // Update the leave request
      await rosterApi.updateLeaveRequestStatus(
        selected.id,
        newStatus,
        adminNotes || null,
      );

      // Handle shift removal if approved
      if (newStatus === 'approved' && affectedShifts.length > 0) {
        // Mark shifts as 'open' (removing staff_id)
        const shiftIds = affectedShifts.map((s) => s.id);
        await rosterApi.bulkUpdateShifts(shiftIds, {
          staff_id: null,
          notes: `Staff member approved for leave. Previously assigned to ${selected.staff?.staff_name}.`,
        });
        toast.success(
          `Leave approved and ${affectedShifts.length} shifts opened.`,
        );
      }

      // Notify staff member via Edge Function or NotificationService
      if (selected.staff?.auth_user_id) {
        if (newStatus === 'approved') {
          await NotificationService.notifyLeaveApproved(
            selected.staff.auth_user_id,
            selected.start_date,
            selected.end_date,
          );
        } else if (newStatus === 'rejected') {
          await NotificationService.notifyLeaveRejected(
            selected.staff.auth_user_id,
            selected.start_date,
            selected.end_date,
            adminNotes || undefined,
          );
        }
      }

      if (newStatus === 'rejected' || affectedShifts.length === 0) {
        toast.success(`Leave request ${newStatus}`);
      }
      setSelected(null);
      setAction(null);
      fetchRequests();
    } catch (err) {
      console.error('Error handling leave action:', err);
      toast.error(`Failed to ${action} request`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Leave Management" />
            <ToolbarDescription>
              Review and approve staff leave requests
            </ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5">
          {loading ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Loading requests...
              </CardContent>
            </Card>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                  <CalendarClock className="size-7 text-muted-foreground" />
                </div>
                <p className="text-gray-900 font-medium">
                  No leave requests found
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  There are no leave requests needing review.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardTable>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-5 py-3 text-xs font-bold uppercase text-muted-foreground">
                        Staff Member
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase text-muted-foreground">
                        Type
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase text-muted-foreground hidden sm:table-cell">
                        Dates
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase text-muted-foreground hidden md:table-cell">
                        Duration
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase text-muted-foreground hidden lg:table-cell">
                        Conflicts
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase text-muted-foreground">
                        Status
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase text-muted-foreground hidden md:table-cell">
                        Requested
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => {
                      const isSelfRow = req.staff?.auth_user_id === user?.id;
                      return (
                        <tr
                          key={req.id}
                          className="border-b border-gray-50 group hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            {req.staff ? (
                              <Link
                                to={`${ROUTES.STAFF_DETAIL}/${req.staff.id}`}
                                className="flex items-center gap-3 group/staff w-fit"
                              >
                                <SecureAvatar
                                  src={req.staff.photo_url}
                                  initials={getInitials(req.staff.staff_name)}
                                  className="size-9 transition-all group-hover/staff:ring-2 group-hover/staff:ring-primary/20"
                                  bucket={STORAGE_BUCKETS.STAFF_PHOTOS}
                                />
                                <div className="flex flex-col">
                                  <span className="font-bold text-blue-700 dark:text-blue-400 group-hover/staff:underline transition-colors">
                                    {req.staff.staff_name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                    {req.reason}
                                  </span>
                                </div>
                              </Link>
                            ) : (
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">
                                  Unknown
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                  {req.reason}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {req.leave_type?.leave_type_name ?? 'Leave'}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell text-sm">
                            {format(new Date(req.start_date), 'dd MMM yyyy')}
                            {req.start_date !== req.end_date && (
                              <>
                                {' '}
                                –{' '}
                                {format(new Date(req.end_date), 'dd MMM yyyy')}
                              </>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell text-sm">
                            {dayCount(req)} day{dayCount(req) !== 1 ? 's' : ''}
                          </td>
                          <td className="px-5 py-3.5 hidden lg:table-cell">
                            {req.status === 'pending' &&
                            conflictCounts[req.id] != null ? (
                              conflictCounts[req.id] > 0 ? (
                                <Badge variant="warning" appearance="light">
                                  {conflictCounts[req.id]} shift
                                  {conflictCounts[req.id] !== 1 ? 's' : ''}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground/50 text-xs">
                                  None
                                </span>
                              )
                            ) : (
                              <span className="text-muted-foreground/50 text-xs">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge
                              variant={statusVariant[req.status] ?? 'secondary'}
                              appearance="light"
                              size="sm"
                            >
                              {statusLabel[req.status] ?? req.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell text-xs">
                            {format(new Date(req.created_at), 'dd MMM yyyy')}
                          </td>
                          <td className="px-5 py-3.5">
                            {req.status === 'pending' && (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  className="h-7 px-2.5 text-xs"
                                  onClick={() => openAction(req, 'approve')}
                                  disabled={isSelfRow || !canEdit}
                                  title={
                                    isSelfRow
                                      ? 'Cannot approve your own leave'
                                      : !canEdit
                                        ? 'Insufficient permissions'
                                        : 'Approve'
                                  }
                                >
                                  <Check className="size-3.5 me-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 px-2.5 text-xs"
                                  onClick={() => openAction(req, 'reject')}
                                  disabled={!canEdit}
                                  title={
                                    !canEdit
                                      ? 'Insufficient permissions'
                                      : 'Reject'
                                  }
                                >
                                  <X className="size-3.5 me-1" /> Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardTable>
            </Card>
          )}
        </div>
      </Container>

      {/* Approve / Reject dialog */}
      <Dialog
        open={!!selected}
        onOpenChange={() => {
          if (!saving) {
            setSelected(null);
            setAction(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {action === 'approve'
                ? 'Approve Leave Request'
                : 'Reject Leave Request'}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve'
                ? `Approving ${selected?.staff?.staff_name}'s request for ${dayCount(selected!)} days.`
                : `Provide a reason for rejecting ${selected?.staff?.staff_name}'s request.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {action === 'approve' && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="size-4 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-blue-900">
                      Important Note
                    </p>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Approving this leave will automatically remove this staff
                      member from any shifts they are assigned to during this
                      period. Those shifts will become "Open" on the roster
                      board.
                    </p>
                  </div>
                </div>

                {shiftsLoading ? (
                  <div className="text-[10px] text-blue-600 animate-pulse">
                    Checking for conflicts...
                  </div>
                ) : affectedShifts.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                      Affected Shifts ({affectedShifts.length})
                    </p>
                    <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1">
                      {affectedShifts.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between text-[10px] bg-white/50 p-1.5 rounded border border-blue-100"
                        >
                          <div className="font-medium text-gray-700">
                            {format(new Date(s.start_date), 'dd MMM')} at{' '}
                            {s.house?.house_name || 'Unknown'}
                          </div>
                          <div className="text-gray-500 italic">
                            {(s.start_time || '').slice(0, 5)} -{' '}
                            {(s.end_time || '').slice(0, 5)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-blue-600 italic">
                    No shifts assigned during this period.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-notes">
                Notes to Staff member (Optional)
              </Label>
              <Textarea
                id="admin-notes"
                placeholder={
                  action === 'reject'
                    ? 'Please explain why this request was rejected...'
                    : 'Optional message...'
                }
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>

            {selected?.attachment_url && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Paperclip className="size-4" />
                <a
                  href={selected.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-medium"
                >
                  View Attachment
                </a>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelected(null);
                setAction(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant={action === 'approve' ? 'primary' : 'destructive'}
              onClick={handleAction}
              disabled={
                saving ||
                !canEdit ||
                (action === 'reject' && !adminNotes.trim())
              }
            >
              {saving
                ? 'Saving...'
                : action === 'approve'
                  ? 'Approve'
                  : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
