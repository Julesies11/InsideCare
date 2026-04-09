import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logActivity } from '@/lib/activity-logger';
import {
  ArrowLeft, Clock, FileText, AlertTriangle, Car, Info, CheckCircle2, ClipboardList,
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
  house_id: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  shift_template: string;
  house: { name: string } | null;
}

interface AssignedChecklist {
  checklist_id: string;
  assignment_title: string;
  status?: string;
}


import { NotificationService } from '@/lib/notification-service';

export function StaffTimesheetForm() {
  const { shiftId } = useParams<{ shiftId: string }>();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [shift, setShift]           = useState<Shift | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [lastSaved, setLastSaved]   = useState<Date | null>(null);
  const [assignedChecklists, setAssignedChecklists] = useState<AssignedChecklist[]>([]);

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
        const start = new Date(`${shift.start_date}T${shift.start_time.slice(0, 5)}`);
        const end   = new Date(`${(shift.end_date || shift.start_date)}T${shift.end_time.slice(0, 5)}`);
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
      const [shiftRes, tsRes, checklistsRes] = await Promise.all([
        supabase
          .from('staff_shifts')
          .select('id, house_id, start_date, end_date, start_time, end_time, shift_template, house:houses(name)')
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
        supabase
          .from('shift_assigned_checklists')
          .select(`
            checklist_id,
            assignment_title,
            submissions:house_checklist_submissions!house_checklist_submissions_checklist_id_fkey(id, status, shift_id)
          `)
          .eq('shift_id', shiftId)
      ]);

      if (shiftRes.data) {
        const s = shiftRes.data as Shift;
        setShift(s);
        setActualStart(`${s.start_date}T${s.start_time.slice(0, 5)}`);
        setActualEnd(`${(s.end_date || s.start_date)}T${s.end_time.slice(0, 5)}`);
      }

      if (tsRes.data) {
        const d = tsRes.data as { id: string; actual_start?: string; actual_end?: string; break_minutes?: number; shift_notes_text?: string; overtime_explanation?: string; travel_km?: number; incident_tag?: boolean; sick_shift?: boolean; notes?: string };
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

      if (checklistsRes.data) {
        const mapped = (checklistsRes.data as any[]).map(cl => {
          // Filter submissions to only those for THIS specific shift instance
          const shiftSubmission = cl.submissions?.find((s: any) => s.shift_id === shiftId);
          return {
            checklist_id: cl.checklist_id,
            assignment_title: cl.assignment_title,
            status: shiftSubmission?.status || 'not_started'
          };
        });
        setAssignedChecklists(mapped);
      }

      setLoading(false);
    };
    load();
  }, [shiftId, user?.staff_id]);

  const saveDraft = useCallback(async () => {
    if (!user?.staff_id || !shiftId || !shift) return;

    // Ensure timestamps are full ISO strings for Supabase
    const formatToFullISO = (val: string) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d.toISOString();
    };

    const payload = {
      staff_id:             user.staff_id,
      shift_id:             shiftId,
      clock_in:             formatToFullISO(actualStart) || `${shift.start_date}T${shift.start_time.slice(0, 5)}:00Z`,
      clock_out:            formatToFullISO(actualEnd)   || `${(shift.end_date || shift.start_date)}T${shift.end_time.slice(0, 5)}:00Z`,
      actual_start:         formatToFullISO(actualStart),
      actual_end:           formatToFullISO(actualEnd),
      break_minutes:        parseInt(breakMins) || 0,
      shift_notes_text:     shiftNotes.trim() || null,
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
      if (data) setExistingId(data.id);
    }
    setLastSaved(new Date());
  }, [user?.staff_id, shiftId, shift, actualStart, actualEnd, breakMins, shiftNotes,
      overtimeExplanation, travelKm, incidentTag, sickShift, sickReason, overtimeHours, existingId]);

  useEffect(() => {
    if (!shift || loading) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(saveDraft, 3000);
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); };
  }, [shift, loading, saveDraft, shiftNotes, actualStart, actualEnd, breakMins, travelKm, incidentTag, sickShift, sickReason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.staff_id || !shiftId || !shift) return;

    // 1. Enforce Checklist Completion
    const incompleteChecklists = assignedChecklists.filter(cl => cl.status !== 'completed');
    if (incompleteChecklists.length > 0) {
      toast.error('Mandatory Checklists Incomplete', {
        description: `Please complete the following routines before submitting: ${incompleteChecklists.map(cl => cl.assignment_title).join(', ')}`,
        action: {
          label: 'Go to Checklists',
          onClick: () => navigate('/staff/checklists')
        }
      });
      return;
    }

    if (!timesValid) { toast.error('Please enter valid actual start and end times'); return; }
    if (overtimeNeedsReason) { toast.error('Please explain the overtime hours before submitting'); return; }

    setSaving(true);
    const now = new Date().toISOString();
    
    // Ensure timestamps are full ISO strings for Supabase
    const formatToFullISO = (val: string) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d.toISOString();
    };

    const clockIn = formatToFullISO(actualStart);
    const clockOut = formatToFullISO(actualEnd);

    if (!clockIn || !clockOut) {
      toast.error('Missing required times. Please ensure start and end times are set.');
      setSaving(false);
      return;
    }

    const payload = {
      staff_id:             user.staff_id,
      shift_id:             shiftId,
      clock_in:             clockIn,
      clock_out:            clockOut,
      actual_start:         clockIn,
      actual_end:           clockOut,
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

    console.log('Timesheet: Submitting payload:', payload);

    let tsId: string | null = existingId;
    try {
      if (existingId) {
        console.log('Timesheet: Updating existing record:', existingId);
        const { error } = await supabase.from('timesheets').update(payload).eq('id', existingId);
        if (error) throw error;
      } else {
        console.log('Timesheet: Inserting new record (upsert)');
        const { data, error } = await supabase
          .from('timesheets')
          .upsert({ ...payload, created_at: now }, { onConflict: 'shift_id,staff_id' })
          .select('id')
          .single();
        if (error) throw error;
        tsId = data.id;
      }

      console.log('Timesheet: DB update successful, updating shift notes...');
      await supabase.from('shift_notes').upsert({
        staff_id:   user.staff_id,
        shift_id:   shiftId,
        start_date: shift.start_date,
        full_note:  shiftNotes.trim(),
        notes:      shiftNotes.trim().slice(0, 100),
      }, { onConflict: 'shift_id,staff_id' });

      console.log('Timesheet: Logging activity...');
      const userName = user.fullname || user.email || 'Staff';
      await logActivity({
        activityType:      'submit',
        entityType:        'timesheet',
        entityId:          tsId ?? shiftId,
        entityName:        `Timesheet – ${format(parseISO(shift.start_date), 'dd MMM yyyy')}`,
        userName,
        customDescription: `Submitted timesheet for ${format(parseISO(shift.start_date), 'dd MMM yyyy')}`,
      });

      console.log('Timesheet: Notifying admins...');
      const { data: admins } = await supabase
        .from('staff')
        .select('auth_user_id')
        .not('auth_user_id', 'is', null);

      if (admins && admins.length > 0) {
        const adminIds = admins.map(a => a.auth_user_id).filter(Boolean) as string[];
        await Promise.all(
          adminIds.map(adminId => 
            NotificationService.notifyTimesheetSubmitted(
              adminId, 
              userName, 
              format(parseISO(shift.start_date), 'dd MMM yyyy')
            )
          )
        );
      }

      toast.success('Timesheet submitted successfully');
      navigate('/staff/timesheets');
    } catch (error: any) {
      console.error('Timesheet submission error details:', error);
      toast.error(`Failed to submit timesheet: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
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
        <Toolbar className="hidden sm:flex">
          <ToolbarHeading>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/staff/roster')} className="-ml-2">
                <ArrowLeft className="size-4" />
              </Button>
              <div>
                <ToolbarPageTitle text="Submit Timesheet" />
                <ToolbarDescription>
                  {format(parseISO(shift.start_date), 'EEEE, dd MMM yyyy')}
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

      <Container className="py-6 sm:py-0">
        <form onSubmit={handleSubmit} className="grid gap-5 lg:gap-7.5 max-w-2xl">

          {/* Section 1 — Shift Notes */}
          <Card className="border-0 sm:border">
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
          <Card className="border-0 sm:border">
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
          <Card className="border-0 sm:border">
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

          {/* Section 4 — Checklist Completion Enforcement */}
          {assignedChecklists.length > 0 && (
            <Card className={cn(
              "border-0 sm:border",
              assignedChecklists.every(cl => cl.status === 'completed') ? "border-green-200 bg-green-50/10" : "border-orange-200 bg-orange-50/10"
            )}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className={cn(
                    "size-4",
                    assignedChecklists.every(cl => cl.status === 'completed') ? "text-green-600" : "text-orange-600"
                  )} />
                  Required Shift Routines
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  You must complete all routines assigned to your shift before submitting your timesheet.
                </p>
              </CardHeader>
              <CardContent>
                <div className="divide-y border rounded-lg bg-white overflow-hidden">
                  {assignedChecklists.map((cl) => (
                    <div key={cl.checklist_id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "size-2 rounded-full shrink-0",
                          cl.status === 'completed' ? "bg-green-500" : "bg-orange-400 animate-pulse"
                        )} />
                        <span className="text-sm font-medium text-gray-700 truncate">{cl.assignment_title}</span>
                      </div>
                      <Badge 
                        variant={cl.status === 'completed' ? 'success' : 'warning'} 
                        appearance="light" 
                        className="text-[10px] font-bold uppercase shrink-0"
                      >
                        {cl.status === 'completed' ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                {assignedChecklists.some(cl => cl.status !== 'completed') && (
                  <div className="mt-4">
                    <Button 
                      type="button" 
                      variant="primary" 
                      className="w-full font-bold shadow-sm"
                      onClick={() => navigate('/staff/checklists')}
                    >
                      <ClipboardList className="size-4 me-2" />
                      Complete Checklists Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3 pb-8">
            <Button 
              type="submit" 
              disabled={saving} 
              className={cn(
                "flex-1 sm:flex-none sm:min-w-[160px]",
                assignedChecklists.some(cl => cl.status !== 'completed') && "opacity-50 grayscale cursor-not-allowed"
              )}
            >
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
