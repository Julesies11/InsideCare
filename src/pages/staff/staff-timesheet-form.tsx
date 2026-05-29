import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
import { TABLES } from '@/config/db-tables';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { QUERY_KEYS } from '@/config/query-keys';
import { TIMESHEET_STATUS } from '@/config/enums';

interface ShiftNoteRes {
  id: string;
  full_note: string | null;
  participant_id: string | null;
}

export function StaffTimesheetForm() {
  const { shiftId } = useParams<{ shiftId: string }>();
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const fromTab     = (location.state as any)?.fromTab;

  const [shift, setShift]           = useState<Shift | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [status, setStatus]         = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [assignedChecklists, setAssignedChecklists] = useState<AssignedChecklist[]>([]);

  const handleBack = () => {
    navigate('/my-timesheets', { state: { activeTab: fromTab } });
  };

  const [shiftNoteStatus, setShiftNoteStatus]         = useState<'not_started' | 'draft' | 'completed'>('not_started');
  const [shiftNoteId, setShiftNoteId]                 = useState<string | null>(null);
  const [actualStart, setActualStart]                 = useState('');
  const [actualEnd, setActualEnd]                     = useState('');
  const [breakMins, setBreakMins]                     = useState('0');
  const [overtimeExplanation, setOvertimeExplanation] = useState('');
  const [travelKm, setTravelKm]                       = useState('');
  const [sickShift, setSickShift]                     = useState(false);
  const [sickReason, setSickReason]                   = useState('');

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
      const [shiftRes, tsRes, shiftNoteRes, checklistsRes] = await Promise.all([
        supabase
          .from(TABLES.STAFF_SHIFTS)
          .select(`id, house_id, start_date, end_date, start_time, end_time, shift_template, house:${TABLES.HOUSES}(house_name)`)
          .eq('id', shiftId)
          .maybeSingle(),
        user?.staff_id
          ? supabase
              .from(TABLES.TIMESHEETS)
              .select('id, actual_start, actual_end, break_minutes, overtime_explanation, travel_km, sick_shift, notes, status')
              .eq('shift_id', shiftId)
              .eq('staff_id', user.staff_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        user?.staff_id
          ? supabase
              .from('ic_shift_notes')
              .select('id, full_note, overall_presentation, shift_summary')
              .eq('shift_id', shiftId)
              .eq('staff_id', user.staff_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from(TABLES.SHIFT_ASSIGNED_CHECKLISTS)
          .select(`
            checklist_id,
            assignment_title,
            submissions:${TABLES.HOUSE_CHECKLIST_SUBMISSIONS}(id, status, shift_id)
          `)
          .eq('shift_id', shiftId)
      ]);

      if (shiftRes.data) {
        const s = shiftRes.data as Shift;
        setShift(s);
        setActualStart(`${s.start_date}T${s.start_time.slice(0, 5)}`);
        setActualEnd(`${(s.end_date || s.start_date)}T${s.end_time.slice(0, 5)}`);
      }

      if (shiftNoteRes?.data) {
        const note = shiftNoteRes.data as any;
        setShiftNoteId(note.id);
        const isCompleted = !!(note.overall_presentation || note.shift_summary || note.full_note);
        setShiftNoteStatus(isCompleted ? 'completed' : 'draft');
      } else {
        setShiftNoteStatus('not_started');
      }

      if (tsRes.data) {
        const d = tsRes.data as { id: string; actual_start?: string; actual_end?: string; break_minutes?: number; overtime_explanation?: string; travel_km?: number; sick_shift?: boolean; notes?: string; status: string };
        setExistingId(d.id);
        setStatus(d.status);
        
        // If it's already submitted (not missing), make it read-only
        if (['pending', 'approved', 'rejected'].includes(d.status)) {
          setIsReadOnly(true);
        }

        if (d.actual_start)          setActualStart(d.actual_start.slice(0, 16));
        if (d.actual_end)            setActualEnd(d.actual_end.slice(0, 16));
        if (d.break_minutes != null) setBreakMins(String(d.break_minutes));
        if (d.overtime_explanation)  setOvertimeExplanation(d.overtime_explanation);
        if (d.travel_km)             setTravelKm(String(d.travel_km));
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
          onClick: () => navigate('/my-checklists')
        }
      });
      return;
    }
    
    // 2. Enforce Clinical Documentation
    if (shiftNoteStatus !== 'completed') {
      toast.error('Shift Note Incomplete', {
        description: 'Please complete your comprehensive Shift Note before submitting your timesheet.',
        action: {
          label: 'Complete Note',
          onClick: () => navigate(`/shift-notes/detail/${shiftNoteId || 'new'}?shiftId=${shiftId}&staffId=${user?.staff_id || ''}`)
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
      overtime_explanation: overtimeExplanation || null,
      travel_km:            parseFloat(travelKm) || 0,
      sick_shift:           sickShift,
      notes:                sickShift ? (sickReason || null) : null,
      overtime_hours:       overtimeHours,
      status: TIMESHEET_STATUS.PENDING,
      submitted_at:         now,
    };

    console.log('Timesheet: Submitting payload:', payload);

    let tsId: string | null = existingId;
    try {
      if (existingId) {
        console.log('Timesheet: Updating existing record:', existingId);
        const { error } = await supabase.from(TABLES.TIMESHEETS).update(payload).eq('id', existingId);
        if (error) throw error;
      } else {
        console.log('Timesheet: Inserting new record (upsert)');
        const { data, error } = await supabase
          .from(TABLES.TIMESHEETS)
          .upsert(payload, { onConflict: 'shift_id,staff_id' })
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("You do not have permission to perform this action");
        tsId = data.id;
      }

      console.log('Timesheet: Notifying admins...');
      const userName = user?.fullname || user?.email || 'Staff';
      const { data: admins } = await supabase
        .from('ic_staff')
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
      handleBack();
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
              <Button variant="ghost" size="sm" onClick={handleBack} className="-ml-2">
                <ArrowLeft className="size-4" />
              </Button>
              <div>
                <ToolbarPageTitle text={isReadOnly ? 'View Timesheet' : 'Submit Timesheet'} />
                <ToolbarDescription>
                  {format(parseISO(shift.start_date), 'EEEE, dd MMM yyyy')}
                  {shift.house ? ` · ${shift.house.house_name}` : ''}
                </ToolbarDescription>
              </div>
            </div>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container className="py-6 sm:py-0">
        <form onSubmit={handleSubmit} className="grid gap-5 lg:gap-7.5 max-w-2xl">

          {/* Read-only status banner */}
          {isReadOnly && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
              <Info className="size-5 text-primary" />
              <p className="text-sm">
                This timesheet has been submitted and is currently <strong>{status}</strong>. It cannot be edited.
              </p>
            </div>
          )}

          {/* Section 1 — Clinical Documentation */}
          <Card className={cn(
              "border-0 sm:border",
              shiftNoteStatus === 'completed' ? "border-green-200 bg-green-50/10" : "border-orange-200 bg-orange-50/10"
            )}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className={cn(
                    "size-4",
                    shiftNoteStatus === 'completed' ? "text-green-600" : "text-orange-600"
                  )} />
                  Clinical Documentation
                </CardTitle>
                {!isReadOnly && <Badge variant={shiftNoteStatus === 'completed' ? "success" : "warning"} appearance="light" className="text-xs">
                  {shiftNoteStatus === 'completed' ? 'Completed' : 'Required'}
                </Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                You must complete your comprehensive Shift Note before submitting your timesheet.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-900">Shift Note Detail</span>
                  <span className="text-xs text-gray-500">
                    {shiftNoteStatus === 'completed' 
                      ? 'Documentation has been completed and saved.'
                      : 'Please complete all required fields in the shift note.'}
                  </span>
                </div>
                {!isReadOnly && (
                  <Button
                    type="button"
                    variant={shiftNoteStatus === 'completed' ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => navigate(`/shift-notes/detail/${shiftNoteId || 'new'}?shiftId=${shiftId}&staffId=${user?.staff_id || ''}`)}
                  >
                    {shiftNoteStatus === 'completed' ? 'Edit Note' : 'Complete Note'}
                  </Button>
                )}
                {isReadOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/shift-notes/detail/${shiftNoteId || 'new'}?shiftId=${shiftId}&staffId=${user?.staff_id || ''}`)}
                  >
                    View Note
                  </Button>
                )}
              </div>
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
                    readOnly={isReadOnly}
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
                    readOnly={isReadOnly}
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
                  readOnly={isReadOnly}
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
                    Overtime Explanation <span className={cn(isReadOnly ? "hidden" : "text-destructive")}>*</span>
                  </Label>
                  <Textarea
                    id="overtimeExplanation"
                    value={overtimeExplanation}
                    onChange={(e) => setOvertimeExplanation(e.target.value)}
                    placeholder="Explain why overtime was required..."
                    rows={2}
                    className={!isReadOnly && overtimeNeedsReason ? 'border-destructive' : ''}
                    readOnly={isReadOnly}
                  />
                  {!isReadOnly && overtimeNeedsReason && (
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
                  readOnly={isReadOnly}
                />
                {!isReadOnly && <p className="text-xs text-muted-foreground">Leave blank if no travel claimed</p>}
              </div>

              <div className="border-t pt-4">
                <label className={cn(
                  "flex items-start gap-3 select-none",
                  isReadOnly ? "cursor-default" : "cursor-pointer"
                )}>
                  <input
                    type="checkbox"
                    checked={sickShift}
                    onChange={(e) => setSickShift(e.target.checked)}
                    className="rounded mt-0.5"
                    disabled={isReadOnly}
                  />
                  <div>
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      Convert to Sick Leave
                    </span>
                    {!isReadOnly && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Check this if you were unwell and this shift should be converted to sick leave.
                      </p>
                    )}
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
                      readOnly={isReadOnly}
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
                {!isReadOnly && (
                  <p className="text-sm text-muted-foreground mt-1">
                    You must complete all routines assigned to your shift before submitting your timesheet.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="divide-y border rounded-lg bg-white overflow-hidden">
                  {assignedChecklists.map((cl) => (
                    <div key={cl.checklist_id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "size-2 rounded-full shrink-0",
                          cl.status === 'completed' ? "bg-green-500" : "bg-orange-400" + (!isReadOnly ? " animate-pulse" : "")
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
                
                {!isReadOnly && assignedChecklists.some(cl => cl.status !== 'completed') && (
                  <div className="mt-4">
                    <Button 
                      type="button" 
                      variant="primary" 
                      className="w-full font-bold shadow-sm"
                      onClick={() => navigate('/my-checklists')}
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
            {!isReadOnly ? (
              <>
                <Button 
                  type="submit" 
                  disabled={saving} 
                  className={cn(
                    "flex-1 sm:flex-none sm:min-w-[160px]",
                    (assignedChecklists.some(cl => cl.status !== 'completed') || shiftNoteStatus !== 'completed') && "opacity-50 grayscale cursor-not-allowed"
                  )}
                >
                  {saving ? 'Submitting...' : 'Submit Timesheet'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                type="button"
                className="flex-1 sm:flex-none sm:min-w-[160px]"
                onClick={handleBack}
              >
                Close
              </Button>
            )}
          </div>

        </form>
      </Container>
    </>
  );
}
