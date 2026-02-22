import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity-logger';
import {
  ArrowLeft, Clock, FileText, AlertTriangle, Car, Info, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/common/container';
import {
  Toolbar, ToolbarHeading, ToolbarPageTitle, ToolbarDescription,
} from '@/partials/common/toolbar';

interface Shift {
  id: string;
  shift_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  house: { name: string } | null;
}


export function StaffTimesheetForm() {
  const { shiftId } = useParams<{ shiftId: string }>();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [shift, setShift]           = useState<Shift | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [lastSaved, setLastSaved]   = useState<Date | null>(null);

  const [shiftNotes, setShiftNotes]                   = useState('');
  const [actualStart, setActualStart]                 = useState('');
  const [actualEnd, setActualEnd]                     = useState('');
  const [breakMins, setBreakMins]                     = useState('0');
  const [overtimeExplanation, setOvertimeExplanation] = useState('');
  const [travelKm, setTravelKm]                       = useState('');
  const [incidentTag, setIncidentTag]                 = useState(false);
  const [sickShift, setSickShift]                     = useState(false);
  const [sickReason, setSickReason]                   = useState('');

  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduledMins = shift
    ? (() => {
        const start = new Date(`${shift.shift_date}T${shift.start_time.slice(0, 5)}`);
        const end   = new Date(`${(shift.end_date || shift.shift_date)}T${shift.end_time.slice(0, 5)}`);
        return (end.getTime() - start.getTime()) / 60000;
      })()
    : 0;

  const actualMins = actualStart && actualEnd
    ? differenceInMinutes(new Date(actualEnd), new Date(actualStart)) - (parseInt(breakMins) || 0)
    : null;

  const overtimeHours      = actualMins !== null && scheduledMins > 0 ? Math.max(0, (actualMins - scheduledMins) / 60) : 0;
  const timesValid         = !!(actualStart && actualEnd && new Date(actualEnd) > new Date(actualStart));
  const overtimeNeedsReason = overtimeHours > 0 && !overtimeExplanation.trim();

  useEffect(() => {
    if (!shiftId) return;
    const load = async () => {
      const [shiftRes, tsRes] = await Promise.all([
        supabase
          .from('staff_shifts')
          .select('id, shift_date, end_date, start_time, end_time, shift_type, house:houses(name)')
          .eq('id', shiftId)
          .maybeSingle(),
        user?.staff_id
          ? supabase
              .from('timesheets')
              .select('id, actual_start, actual_end, break_minutes, shift_notes_text, overtime_explanation, travel_km, incident_tag, sick_shift, notes')
              .eq('shift_id', shiftId)
              .eq('staff_id', user.staff_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (shiftRes.data) {
        const s = shiftRes.data as Shift;
        setShift(s);
        setActualStart(`${s.shift_date}T${s.start_time.slice(0, 5)}`);
        setActualEnd(`${(s.end_date || s.shift_date)}T${s.end_time.slice(0, 5)}`);
      }

      if (tsRes.data) {
        const d = tsRes.data as any;
        setExistingId(d.id);
        if (d.actual_start)          setActualStart(d.actual_start.slice(0, 16));
        if (d.actual_end)            setActualEnd(d.actual_end.slice(0, 16));
        if (d.break_minutes != null) setBreakMins(String(d.break_minutes));
        if (d.shift_notes_text)      setShiftNotes(d.shift_notes_text);
        if (d.overtime_explanation)  setOvertimeExplanation(d.overtime_explanation);
        if (d.travel_km)             setTravelKm(String(d.travel_km));
        if (d.incident_tag)          setIncidentTag(d.incident_tag);
        if (d.sick_shift)            setSickShift(d.sick_shift);
        if (d.notes)                 setSickReason(d.notes);
      }
      setLoading(false);
    };
    load();
  }, [shiftId, user?.staff_id]);

  const saveDraft = useCallback(async () => {
    if (!user?.staff_id || !shiftId || !shift) return;
    const payload = {
      staff_id:             user.staff_id,
      shift_id:             shiftId,
      clock_in:             actualStart || `${shift.shift_date}T${shift.start_time.slice(0, 5)}`,
      clock_out:            actualEnd   || `${(shift.end_date || shift.shift_date)}T${shift.end_time.slice(0, 5)}`,
      actual_start:         actualStart || null,
      actual_end:           actualEnd   || null,
      break_minutes:        parseInt(breakMins) || 0,
      shift_notes_text:     shiftNotes || null,
      overtime_explanation: overtimeExplanation || null,
      travel_km:            parseFloat(travelKm) || 0,
      incident_tag:         incidentTag,
      sick_shift:           sickShift,
      notes:                sickShift ? (sickReason || null) : null,
      overtime_hours:       overtimeHours,
      status:               'draft',
      updated_at:           new Date().toISOString(),
    };
    if (existingId) {
      await supabase.from('timesheets').update(payload).eq('id', existingId);
    } else {
      const { data } = await supabase
        .from('timesheets')
        .upsert({ ...payload, created_at: new Date().toISOString() }, { onConflict: 'shift_id,staff_id' })
        .select('id')
        .single();
      if (data) setExistingId((data as any).id);
    }
    setLastSaved(new Date());
  }, [user?.staff_id, shiftId, shift, actualStart, actualEnd, breakMins, shiftNotes,
      overtimeExplanation, travelKm, incidentTag, sickShift, sickReason, overtimeHours, existingId]);

  useEffect(() => {
    if (!shift || loading) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(saveDraft, 3000);
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); };
  }, [shiftNotes, actualStart, actualEnd, breakMins, travelKm, incidentTag, sickShift, sickReason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.staff_id || !shiftId || !shift) return;

    if (!timesValid) { toast.error('Please enter valid actual start and end times'); return; }
    if (overtimeNeedsReason) { toast.error('Please explain the overtime hours before submitting'); return; }

    setSaving(true);
    const now = new Date().toISOString();
    const payload = {
      staff_id:             user.staff_id,
      shift_id:             shiftId,
      clock_in:             actualStart,
      clock_out:            actualEnd,
      actual_start:         actualStart,
      actual_end:           actualEnd,
      break_minutes:        parseInt(breakMins) || 0,
      shift_notes_text:     shiftNotes.trim(),
      overtime_explanation: overtimeExplanation || null,
      travel_km:            parseFloat(travelKm) || 0,
      incident_tag:         incidentTag,
      sick_shift:           sickShift,
      notes:                sickShift ? (sickReason || null) : null,
      overtime_hours:       overtimeHours,
      status:               'pending',
      submitted_at:         now,
      updated_at:           now,
    };

    let tsId: string | null = existingId;
    if (existingId) {
      const { error } = await supabase.from('timesheets').update(payload).eq('id', existingId);
      if (error) { toast.error('Failed to submit timesheet'); setSaving(false); return; }
    } else {
      const { data, error } = await supabase
        .from('timesheets')
        .upsert({ ...payload, created_at: now }, { onConflict: 'shift_id,staff_id' })
        .select('id')
        .single();
      if (error) { toast.error('Failed to submit timesheet'); setSaving(false); return; }
      tsId = (data as any).id;
    }

    await supabase.from('shift_notes').upsert({
      staff_id:   user.staff_id,
      shift_id:   shiftId,
      shift_date: shift.shift_date,
      full_note:  shiftNotes.trim(),
      notes:      shiftNotes.trim().slice(0, 100),
    }, { onConflict: 'shift_id,staff_id' });

    const userName = user.fullname || user.email || 'Staff';
    await logActivity({
      activityType:      'submit',
      entityType:        'timesheet',
      entityId:          tsId ?? shiftId,
      entityName:        `Timesheet – ${format(parseISO(shift.shift_date), 'dd MMM yyyy')}`,
      userName,
      customDescription: `Submitted timesheet for ${format(parseISO(shift.shift_date), 'dd MMM yyyy')}`,
    });

    const { data: admins } = await supabase
      .from('staff')
      .select('auth_user_id')
      .not('auth_user_id', 'is', null);

    if (admins && admins.length > 0) {
      const notifRows = admins
        .filter((a) => a.auth_user_id)
        .map((a) => ({
          user_id: a.auth_user_id as string,
          type:    'timesheet_submitted',
          title:   'New Timesheet Submitted',
          body:    `${userName} submitted a timesheet for ${format(parseISO(shift.shift_date), 'dd MMM yyyy')}.`,
          link:    '/employees/timesheets',
        }));
      await supabase.from('notifications').insert(notifRows);
    }

    toast.success('Timesheet submitted successfully');
    navigate('/staff/timesheets');
    setSaving(false);
  };

  if (loading) {
    return (
      <Container>
        <div className="py-10 text-center text-sm text-muted-foreground">Loading shift...</div>
      </Container>
    );
  }
  if (!shift) {
    return (
      <Container>
        <div className="py-10 text-center text-sm text-muted-foreground">Shift not found.</div>
      </Container>
    );
  }

  const scheduledHrsDisplay  = (scheduledMins / 60).toFixed(1);
  const actualHrsDisplay     = actualMins !== null ? Math.max(0, actualMins / 60).toFixed(1) : '—';

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/staff/roster')} className="-ml-2">
                <ArrowLeft className="size-4" />
              </Button>
              <div>
                <ToolbarPageTitle text="Submit Timesheet" />
                <ToolbarDescription>
                  {format(parseISO(shift.shift_date), 'EEEE, dd MMM yyyy')}
                  {shift.house ? ` · ${shift.house.name}` : ''}
                </ToolbarDescription>
              </div>
            </div>
          </ToolbarHeading>
          {lastSaved && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-green-500" />
              Draft saved {format(lastSaved, 'HH:mm')}
            </div>
          )}
        </Toolbar>
      </Container>

      <Container>
        <form onSubmit={handleSubmit} className="grid gap-5 lg:gap-7.5 max-w-2xl">

          {/* Section 1 — Shift Notes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-4 text-primary" />
                  Shift Notes
                </CardTitle>
                <Badge variant="destructive" appearance="light" className="text-xs">Required</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Document what happened during this shift.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                id="shiftNotes"
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                placeholder="Describe what happened during the shift — participant wellbeing, activities, any concerns or incidents..."
                rows={6}
                className=""
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={incidentTag}
                    onChange={(e) => setIncidentTag(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 text-orange-500" />
                    Incident occurred this shift
                  </span>
                </label>
                <span className="text-xs text-muted-foreground">
                  {shiftNotes.length} chars
                </span>
              </div>
              {incidentTag && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 p-3 flex gap-2">
                  <Info className="size-4 text-orange-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    An incident report will be flagged for supervisor review. Ensure your notes clearly describe the incident.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2 — Actual Hours */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-primary" />
                Actual Hours Worked
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Rostered: {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)} ({scheduledHrsDisplay} hrs scheduled)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="actualStart">Actual Start</Label>
                  <Input
                    id="actualStart"
                    type="datetime-local"
                    value={actualStart}
                    onChange={(e) => setActualStart(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="actualEnd">Actual End</Label>
                  <Input
                    id="actualEnd"
                    type="datetime-local"
                    value={actualEnd}
                    onChange={(e) => setActualEnd(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="breakMins">Break (minutes)</Label>
                <Input
                  id="breakMins"
                  type="number"
                  min="0"
                  max="480"
                  value={breakMins}
                  onChange={(e) => setBreakMins(e.target.value)}
                  className="max-w-[140px]"
                />
              </div>
              {actualMins !== null && (
                <div className="rounded-lg bg-muted/50 border px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total hours worked</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{actualHrsDisplay} hrs</span>
                    {overtimeHours > 0 && (
                      <Badge variant="warning" appearance="light" className="text-xs">
                        +{overtimeHours.toFixed(1)} hrs overtime
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              {overtimeHours > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="overtimeExplanation">
                    Overtime Explanation <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="overtimeExplanation"
                    value={overtimeExplanation}
                    onChange={(e) => setOvertimeExplanation(e.target.value)}
                    placeholder="Explain why overtime was required..."
                    rows={2}
                    className={overtimeNeedsReason ? 'border-destructive' : ''}
                  />
                  {overtimeNeedsReason && (
                    <p className="text-xs text-destructive">Required when overtime is claimed</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 3 — Additional Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Additional Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="travelKm" className="flex items-center gap-1.5">
                  <Car className="size-3.5 text-muted-foreground" />
                  Travel Distance (km)
                </Label>
                <Input
                  id="travelKm"
                  type="number"
                  min="0"
                  step="0.1"
                  value={travelKm}
                  onChange={(e) => setTravelKm(e.target.value)}
                  placeholder="0"
                  className="max-w-[140px]"
                />
                <p className="text-xs text-muted-foreground">Leave blank if no travel claimed</p>
              </div>

              <div className="border-t pt-4">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sickShift}
                    onChange={(e) => setSickShift(e.target.checked)}
                    className="rounded mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      Convert to Sick Leave
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Check this if you were unwell and this shift should be converted to sick leave.
                    </p>
                  </div>
                </label>
                {sickShift && (
                  <div className="mt-3 space-y-1.5">
                    <Label htmlFor="sickReason">Reason (optional)</Label>
                    <Textarea
                      id="sickReason"
                      value={sickReason}
                      onChange={(e) => setSickReason(e.target.value)}
                      placeholder="Brief description of illness..."
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center gap-3 pb-8">
            <Button type="submit" disabled={saving} className="flex-1 sm:flex-none sm:min-w-[160px]">
              {saving ? 'Submitting...' : 'Submit Timesheet'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/staff/roster')}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>

        </form>
      </Container>
    </>
  );
}
