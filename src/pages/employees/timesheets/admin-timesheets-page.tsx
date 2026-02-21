import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Timesheet {
  id: string;
  staff_id: string;
  shift_id: string | null;
  clock_in: string;
  clock_out: string;
  break_minutes: number;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  staff: { name: string; auth_user_id: string | null } | null;
}

const statusVariant: Record<string, 'secondary' | 'success' | 'destructive'> = {
  pending: 'secondary',
  approved: 'success',
  rejected: 'destructive',
};

export function AdminTimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Timesheet | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTimesheets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('timesheets')
      .select('*, staff:staff(name, auth_user_id)')
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load timesheets');
    else setTimesheets((data as Timesheet[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const openAction = (ts: Timesheet, act: 'approve' | 'reject') => {
    setSelected(ts);
    setAction(act);
    setAdminNotes('');
  };

  const handleSubmit = async () => {
    if (!selected || !action) return;
    setSaving(true);
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { error } = await supabase
      .from('timesheets')
      .update({ status: newStatus, admin_notes: adminNotes || null, updated_at: new Date().toISOString() })
      .eq('id', selected.id);

    if (error) {
      toast.error('Failed to update timesheet');
    } else {
      toast.success(`Timesheet ${newStatus}`);
      // Notify the staff member
      if (selected.staff?.auth_user_id) {
        await supabase.from('notifications').insert({
          user_id: selected.staff.auth_user_id,
          type: `timesheet_${newStatus}`,
          title: `Timesheet ${newStatus}`,
          body: adminNotes || `Your timesheet for ${format(new Date(selected.clock_in), 'dd MMM yyyy')} has been ${newStatus}.`,
          link: '/staff/timesheets',
        });
      }
      setSelected(null);
      setAction(null);
      fetchTimesheets();
    }
    setSaving(false);
  };

  const totalHours = (ts: Timesheet) => {
    const ms = new Date(ts.clock_out).getTime() - new Date(ts.clock_in).getTime();
    const mins = ms / 60000 - ts.break_minutes;
    return (mins / 60).toFixed(1);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Timesheets</h1>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : timesheets.length === 0 ? (
        <p className="text-muted-foreground">No timesheets submitted yet.</p>
      ) : (
        <div className="space-y-3">
          {timesheets.map((ts) => (
            <Card key={ts.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {ts.staff?.name ?? 'Unknown Staff'}
                  </CardTitle>
                  <Badge variant={statusVariant[ts.status] ?? 'default'}>
                    {ts.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground flex gap-4 flex-wrap">
                  <span><Clock className="inline size-3.5 mr-1" />{format(new Date(ts.clock_in), 'dd MMM yyyy HH:mm')} – {format(new Date(ts.clock_out), 'HH:mm')}</span>
                  <span>Break: {ts.break_minutes} min</span>
                  <span>Total: {totalHours(ts)} hrs</span>
                </div>
                {ts.notes && <p className="text-sm">{ts.notes}</p>}
                {ts.admin_notes && (
                  <p className="text-sm text-muted-foreground italic">Admin: {ts.admin_notes}</p>
                )}
                {ts.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => openAction(ts, 'approve')}>
                      <Check className="size-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => openAction(ts, 'reject')}>
                      <X className="size-4 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === 'approve' ? 'Approve' : 'Reject'} Timesheet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Admin Notes (optional)</Label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add a note for the staff member..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setAction(null); }}>Cancel</Button>
            <Button
              variant={action === 'approve' ? 'default' : 'destructive'}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Saving...' : action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
