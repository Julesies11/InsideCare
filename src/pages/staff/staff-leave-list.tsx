import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '@/auth/context/auth-context';
import { format } from 'date-fns';
import { Plus, Umbrella, Paperclip } from 'lucide-react';
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
import { rosterApi } from '@/api/roster.api';
import { ROUTES } from '@/config/routes.config';
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
  leave_type: { leave_type_name: string } | null;
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

  const fetchRequests = useCallback(async () => {
    if (!user?.staff_id) { setLoading(false); return; }
    try {
      const data = await rosterApi.listLeaveRequests(user.staff_id);
      setRequests(data as any[]);
    } catch (error) {
      console.error('Error loading leave requests:', error);
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, [user?.staff_id]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  const dayCount = (req: LeaveRequest) => {
    const ms = new Date(req.end_date).getTime() - new Date(req.start_date).getTime();
    return Math.round(ms / 86400000) + 1;
  };

  return (
    <>
      <Container>
        <Toolbar className="hidden sm:flex">
          <ToolbarHeading>
            <ToolbarPageTitle text="Leave Requests" />
            <ToolbarDescription>View and manage your leave requests</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button onClick={() => navigate(`${ROUTES.MY_LEAVE}/new`)}>
              <Plus className="size-4 me-1.5" />
              New Request
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="py-6 sm:py-0">
        <div className="grid gap-5 lg:gap-7.5">
          {loading ? (
            <Card className="border-0 sm:border">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Loading...
              </CardContent>
            </Card>
          ) : requests.length === 0 ? (
            <Card className="border-0 sm:border">
              <CardContent className="py-16 flex flex-col items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                  <Umbrella className="size-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">No leave requests yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Submit your first leave request to get started.</p>
                </div>
                <Button onClick={() => navigate(`${ROUTES.MY_LEAVE}/new`)}>
                  <Plus className="size-4 me-1.5" />
                  New Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 sm:border">
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
                      <tr key={req.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5 font-medium">
                          <Link 
                            to={`${ROUTES.MY_LEAVE}/${req.id}/edit`}
                            className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline transition-colors"
                          >
                            {req.leave_type?.leave_type_name ?? 'Leave'}
                          </Link>
                        </td>
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
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          {req.attachment_url ? (
                            <a
                              href={req.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline transition-colors"
                              title="View attachment"
                            >
                              <Paperclip className="size-3.5" />
                              View
                            </a>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardTable>
            </Card>
          )}
        </div>
      </Container>
    </>
  );
}
