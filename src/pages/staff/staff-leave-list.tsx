import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { format } from 'date-fns';
import { Plus, Umbrella, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTable } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
} from '@/partials/common/toolbar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface LeaveRequest {
  id: string;
  leave_type: { name: string } | null;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
}

const statusVariant: Record<string, 'secondary' | 'success' | 'destructive' | 'warning'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
};

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function StaffLeaveList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<LeaveRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRequests = async () => {
    if (!user?.staff_id) { setLoading(false); return; }
    const { data } = await supabase
      .from('leave_requests')
      .select('id, leave_type:leave_types(name), start_date, end_date, reason, status, admin_notes, created_at')
      .eq('staff_id', user.staff_id)
      .order('created_at', { ascending: false });
    setRequests((data as LeaveRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [user?.staff_id]);

  const dayCount = (req: LeaveRequest) => {
    const ms = new Date(req.end_date).getTime() - new Date(req.start_date).getTime();
    return Math.round(ms / 86400000) + 1;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('leave_requests').delete().eq('id', deleteTarget.id);
    if (error) {
      toast.error('Failed to delete leave request');
    } else {
      toast.success('Leave request deleted');
      setRequests(prev => prev.filter(r => r.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Leave Requests" />
            <ToolbarDescription>View and manage your leave requests</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button onClick={() => navigate('/staff/leave/new')}>
              <Plus className="size-4 me-1.5" />
              New Request
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5">
          {loading ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Loading...
              </CardContent>
            </Card>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="py-16 flex flex-col items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                  <Umbrella className="size-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">No leave requests yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Submit your first leave request to get started.</p>
                </div>
                <Button onClick={() => navigate('/staff/leave/new')}>
                  <Plus className="size-4 me-1.5" />
                  New Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="py-4 px-5">
                <span className="text-sm text-muted-foreground">{requests.length} request{requests.length !== 1 ? 's' : ''}</span>
              </CardHeader>
              <CardTable>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Type</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Dates</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Duration</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Notes</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5 font-medium">{req.leave_type?.name ?? 'Leave'}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {format(new Date(req.start_date), 'dd MMM yyyy')}
                          {req.start_date !== req.end_date && (
                            <> – {format(new Date(req.end_date), 'dd MMM yyyy')}</>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                          {dayCount(req)} day{dayCount(req) !== 1 ? 's' : ''}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={statusVariant[req.status] ?? 'secondary'} appearance="light">
                            {statusLabel[req.status] ?? req.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell max-w-xs">
                          {req.admin_notes ? (
                            <span className="italic">{req.admin_notes}</span>
                          ) : req.reason ? (
                            <span className="truncate block">{req.reason}</span>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {req.status === 'pending' && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                title="Edit"
                                onClick={() => navigate(`/staff/leave/${req.id}/edit`)}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                title="Delete"
                                onClick={() => setDeleteTarget(req)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardTable>
            </Card>
          )}
        </div>
      </Container>
      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteTarget?.leave_type?.name ?? 'leave'} request
              ({deleteTarget ? format(new Date(deleteTarget.start_date), 'dd MMM') : ''}
              {deleteTarget && deleteTarget.start_date !== deleteTarget.end_date
                ? ` – ${format(new Date(deleteTarget.end_date), 'dd MMM yyyy')}`
                : deleteTarget ? ` ${format(new Date(deleteTarget.start_date), 'yyyy')}` : ''})?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
