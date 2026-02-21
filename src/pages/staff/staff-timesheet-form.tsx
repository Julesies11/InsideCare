import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface Shift {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  house: { name: string } | null;
}

export function StaffTimesheetForm() {
  const { shiftId } = useParams<{ shiftId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [breakMins, setBreakMins] = useState('0');
  const [notes, setNotes] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');

  useEffect(() => {
    if (!shiftId) return;
    const fetchShift = async () => {
      const { data } = await supabase
        .from('staff_shifts')
        .select('id, shift_date, start_time, end_time, house:houses(name)')
        .eq('id', shiftId)
        .maybeSingle();
      if (data) {
        const s = data as Shift;
        setShift(s);
        // Pre-fill with scheduled times
        setClockIn(`${s.shift_date}T${s.start_time?.slice(0, 5) || '00:00'}`);
        setClockOut(`${s.shift_date}T${s.end_time?.slice(0, 5) || '00:00'}`);
      }
      setLoading(false);
    };
    fetchShift();
  }, [shiftId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.staff_id || !shiftId) return;

    if (!clockIn || !clockOut) {
      toast.error('Please enter clock in and clock out times');
      return;
    }

    setSaving(true);

    const { data: tsData, error: tsError } = await supabase
      .from('timesheets')
      .insert({
        staff_id: user.staff_id,
        shift_id: shiftId,
        clock_in: new Date(clockIn).toISOString(),
        clock_out: new Date(clockOut).toISOString(),
        break_minutes: parseInt(breakMins) || 0,
        notes: notes || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (tsError) {
      toast.error('Failed to submit timesheet');
      setSaving(false);
      return;
    }

    // Write shift notes to shift_notes table if provided
    if (shiftNotes.trim() && tsData) {
      await supabase.from('shift_notes').insert({
        staff_id: user.staff_id,
        shift_id: shiftId,
        note: shiftNotes.trim(),
      });
    }

    // Notify admins
    const { data: admins } = await supabase
      .from('staff')
      .select('auth_user_id')
      .not('auth_user_id', 'is', null);

    // Get all admin auth users
    const { data: adminUsers } = await supabase.auth.admin?.listUsers?.() ?? { data: null };
    // Fallback: notify via a generic approach - insert notification for each admin auth_user_id
    // Since we can't call admin API from client, we insert notifications for staff marked as admins
    // Admins will see pending timesheets on their approval page regardless
    if (admins && admins.length > 0) {
      const staffName = user.first_name
        ? `${user.first_name} ${user.last_name || ''}`.trim()
        : user.email;
      const notifRows = admins
        .filter((a) => a.auth_user_id)
        .map((a) => ({
          user_id: a.auth_user_id as string,
          type: 'timesheet_submitted',
          title: 'New Timesheet Submitted',
          body: `${staffName} submitted a timesheet for ${shift ? format(parseISO(shift.shift_date), 'dd MMM yyyy') : 'a shift'}.`,
          link: '/employees/timesheets',
        }));
      if (notifRows.length > 0) {
        await supabase.from('notifications').insert(notifRows);
      }
    }

    toast.success('Timesheet submitted successfully');
    navigate('/staff/timesheets');
    setSaving(false);
  };

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading...</div>;
  if (!shift) return <div className="p-4 text-sm text-muted-foreground">Shift not found.</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/staff/roster')}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold">Submit Timesheet</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-normal">Shift Details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p className="font-medium">{format(parseISO(shift.shift_date), 'EEEE, dd MMM yyyy')}</p>
          <p className="text-muted-foreground">
            Scheduled: {shift.start_time?.slice(0, 5)} – {shift.end_time?.slice(0, 5)}
            {shift.house ? ` · ${shift.house.name}` : ''}
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="clockIn">Clock In</Label>
          <Input
            id="clockIn"
            type="datetime-local"
            value={clockIn}
            onChange={(e) => setClockIn(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clockOut">Clock Out</Label>
          <Input
            id="clockOut"
            type="datetime-local"
            value={clockOut}
            onChange={(e) => setClockOut(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="breakMins">Break (minutes)</Label>
          <Input
            id="breakMins"
            type="number"
            min="0"
            value={breakMins}
            onChange={(e) => setBreakMins(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Timesheet Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about your hours..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shiftNotes">Shift Notes</Label>
          <Textarea
            id="shiftNotes"
            value={shiftNotes}
            onChange={(e) => setShiftNotes(e.target.value)}
            placeholder="Notes about the shift, participants, incidents..."
            rows={4}
          />
        </div>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Submitting...' : 'Submit Timesheet'}
        </Button>
      </form>
    </div>
  );
}
