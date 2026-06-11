import { useEffect, useMemo, useState } from 'react';
import { rosterApi } from '@/api/roster.api';
import { shiftNotesApi } from '@/api/shift-notes.api';
import { staffApi } from '@/api/staff.api';
import { timesheetsApi } from '@/api/timesheets.api';
import { useAuth } from '@/auth/context/auth-context';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { differenceInMinutes, format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Info,
  Pencil,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { TIMESHEET_STATUS } from '@/config/enums';
import { ROUTES } from '@/config/routes.config';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { NotificationService } from '@/lib/notification-service';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { Textarea } from '@/components/ui/textarea';
import { Container } from '@/components/common/container';

interface Shift {
  id: string;
  house_id: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  shift_template: string;
  house: { house_name: string } | null;
  participants?: any[];
}

interface AssignedChecklist {
  checklist_id: string;
  assignment_title: string;
  status?: string;
}

const getInitials = (name?: string) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function StaffTimesheetForm() {
  const { shiftId } = useParams<{ shiftId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromTab = (location.state as any)?.fromTab;

  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [assignedChecklists, setAssignedChecklists] = useState<
    AssignedChecklist[]
  >([]);

  const handleBack = () => {
    navigate(ROUTES.MY_TIMESHEETS, { state: { activeTab: fromTab } });
  };

  const [shiftNotes, setShiftNotes] = useState<any[]>([]);
  const [actualStart, setActualStart] = useState('');
  const [actualEnd, setActualEnd] = useState('');
  const [breakMins, setBreakMins] = useState('0');
  const [overtimeExplanation, setOvertimeExplanation] = useState('');
  const [travelKm, setTravelKm] = useState('');
  const [sickShift, setSickShift] = useState(false);
  const [sickReason, setSickReason] = useState('');

  const scheduledMins = shift
    ? (() => {
        const start = new Date(
          `${shift.start_date}T${shift.start_time.slice(0, 5)}`,
        );
        const end = new Date(
          `${shift.end_date || shift.start_date}T${shift.end_time.slice(0, 5)}`,
        );
        return (end.getTime() - start.getTime()) / 60000;
      })()
    : 0;

  const actualMins =
    actualStart && actualEnd
      ? differenceInMinutes(new Date(actualEnd), new Date(actualStart)) -
        (parseInt(breakMins) || 0)
      : null;

  const overtimeHours =
    actualMins !== null && scheduledMins > 0
      ? Math.max(0, (actualMins - scheduledMins) / 60)
      : 0;
  const timesValid = !!(
    actualStart &&
    actualEnd &&
    new Date(actualEnd) > new Date(actualStart)
  );
  const overtimeNeedsReason = overtimeHours > 0 && !overtimeExplanation.trim();

  useEffect(() => {
    if (!shiftId) return;
    const load = async () => {
      console.log('DEBUG: Starting timesheet data load for shiftId:', shiftId);
      try {
        const [shiftRes, tsRes, shiftNoteRes] = await Promise.all([
          rosterApi
            .getShift(shiftId)
            .then((res) => {
              console.log('DEBUG: rosterApi.getShift SUCCESS');
              return res;
            })
            .catch((err) => {
              console.error('DEBUG: rosterApi.getShift FAILED:', err);
              throw err;
            }),
          (user?.staff_id
            ? timesheetsApi.getExisting(shiftId, user.staff_id)
            : Promise.resolve(null)
          )
            .then((res) => {
              console.log('DEBUG: timesheetsApi.getExisting SUCCESS');
              return res;
            })
            .catch((err) => {
              console.error('DEBUG: timesheetsApi.getExisting FAILED:', err);
              throw err;
            }),
          (user?.staff_id
            ? shiftNotesApi.getByShiftAndStaff(shiftId, user.staff_id)
            : Promise.resolve(null)
          )
            .then((res) => {
              console.log('DEBUG: shiftNotesApi.getByShiftAndStaff SUCCESS');
              return res;
            })
            .catch((err) => {
              console.error(
                'DEBUG: shiftNotesApi.getByShiftAndStaff FAILED:',
                err,
              );
              throw err;
            }),
        ]);

        if (shiftRes) {
          const s = shiftRes as any;
          setShift(s);
          setActualStart(`${s.start_date}T${s.start_time.slice(0, 5)}`);
          setActualEnd(
            `${s.end_date || s.start_date}T${s.end_time.slice(0, 5)}`,
          );

          if (s.assigned_checklists) {
            const mapped = s.assigned_checklists.map((cl: any) => ({
              ...cl,
              status: cl.submissions?.[0]?.status || 'pending',
            }));
            setAssignedChecklists(mapped);
          }
        }

        if (shiftNoteRes && Array.isArray(shiftNoteRes)) {
          setShiftNotes(shiftNoteRes);
        } else {
          setShiftNotes([]);
        }

        if (tsRes && Array.isArray(tsRes) && tsRes.length > 0) {
          const d = tsRes[0] as any; // Pick the most recent one
          setExistingId(d.id);
          setStatus(d.status);

          if (['pending', 'approved', 'rejected'].includes(d.status)) {
            setIsReadOnly(true);
          }

          if (d.actual_start) setActualStart(d.actual_start.slice(0, 16));
          if (d.actual_end) setActualEnd(d.actual_end.slice(0, 16));
          if (d.break_minutes != null) setBreakMins(String(d.break_minutes));
          if (d.overtime_explanation)
            setOvertimeExplanation(d.overtime_explanation);
          if (d.travel_km) setTravelKm(String(d.travel_km));
          if (d.sick_shift) setSickShift(d.sick_shift);
          if (d.notes) setSickReason(d.notes);
        }
      } catch (error) {
        console.error('Failed to load timesheet data:', error);
        toast.error('Failed to load shift data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shiftId, user?.staff_id]);

  // Scroll to hash-linked section once page content is loaded
  useEffect(() => {
    if (!loading && shift) {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.slice(1);
        const timer = setTimeout(() => {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: 'auto', block: 'start' });
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, shift]);

  // Update URL hash as user scrolls
  useEffect(() => {
    if (loading || !shift) return;

    const sections = [
      'actual-hours',
      'additional-options',
      'shift-notes',
      'required-routines',
    ];
    let activeSectionId = '';

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (window.scrollY < 100) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          const id = entry.target.id;
          if (activeSectionId !== id) {
            activeSectionId = id;
            window.history.replaceState(
              null,
              '',
              window.location.pathname + window.location.search + '#' + id,
            );
          }
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -60% 0px',
      threshold: [0.3],
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    });

    const handleScroll = () => {
      if (window.scrollY < 100) {
        if (window.location.hash) {
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search,
          );
          activeSectionId = '';
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loading, shift]);

  const shiftParticipants = useMemo(() => {
    if (!shift) return [];
    return (
      (shift.participants || [])
        ?.map((p: any) => {
          const part = p.participant || p;
          const actualPart = Array.isArray(part) ? part[0] : part;
          return {
            id: actualPart?.id || p.id || p.participant_id,
            participant_name:
              actualPart?.participant_name || p.participant_name,
            photo_url: actualPart?.photo_url || p.photo_url || null,
          };
        })
        .filter((p: any) => p.id && p.participant_name) || []
    );
  }, [shift]);

  const participantNotes = useMemo(() => {
    if (!shift) return [];

    if (shiftParticipants.length === 0) {
      // General House Note
      const note = shiftNotes.find((n) => !n.participant_id);
      const exists = !!note;
      const status: 'Completed' | 'Draft' | 'Overdue' = exists
        ? note.status === 'draft'
          ? 'Draft'
          : 'Completed'
        : 'Overdue';
      return [
        {
          id: 'general',
          participant_name: 'General House Note',
          status,
          noteId: note?.id || null,
          photo_url: null,
          updated_at: note?.updated_at || null,
          reference_id: note?.reference_id || null,
        },
      ];
    }

    return shiftParticipants.map((p) => {
      const note = shiftNotes.find((n) => n.participant_id === p.id);
      const exists = !!note;
      const status: 'Completed' | 'Draft' | 'Overdue' = exists
        ? note.status === 'draft'
          ? 'Draft'
          : 'Completed'
        : 'Overdue';
      return {
        id: p.id,
        participant_name: p.participant_name,
        photo_url: p.photo_url,
        status,
        noteId: note?.id || null,
        updated_at: note?.updated_at || null,
        reference_id: note?.reference_id || null,
      };
    });
  }, [shift, shiftParticipants, shiftNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.staff_id || !shiftId || !shift) return;

    const incompleteChecklists = assignedChecklists.filter(
      (cl) => cl.status !== 'completed',
    );
    if (incompleteChecklists.length > 0) {
      toast.error('Mandatory Checklists Incomplete', {
        description: `Please complete the following routines before submitting: ${incompleteChecklists.map((cl) => cl.assignment_title).join(', ')}`,
        action: {
          label: 'Go to Checklists',
          onClick: () => navigate(ROUTES.MY_CHECKLISTS),
        },
      });
      return;
    }

    if (!timesValid) {
      toast.error('Please enter valid actual start and end times');
      return;
    }
    if (overtimeNeedsReason) {
      toast.error('Please explain the overtime hours before submitting');
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();

    const formatToFullISO = (val: string) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d.toISOString();
    };

    const clockIn = formatToFullISO(actualStart);
    const clockOut = formatToFullISO(actualEnd);

    if (!clockIn || !clockOut) {
      toast.error(
        'Missing required times. Please ensure start and end times are set.',
      );
      setSaving(false);
      return;
    }

    const payload = {
      staff_id: user.staff_id,
      shift_id: shiftId,
      clock_in: clockIn,
      clock_out: clockOut,
      actual_start: clockIn,
      actual_end: clockOut,
      break_minutes: parseInt(breakMins) || 0,
      overtime_explanation: overtimeExplanation || null,
      travel_km: parseFloat(travelKm) || 0,
      sick_shift: sickShift,
      notes: sickShift ? sickReason || null : null,
      overtime_hours: overtimeHours,
      status: TIMESHEET_STATUS.PENDING as any,
      submitted_at: now,
    };

    try {
      if (existingId) {
        await timesheetsApi.update(existingId, payload);
      } else {
        await timesheetsApi.create(payload);
      }

      const userName = user?.fullname || user?.email || 'Staff';
      const admins = await staffApi.listAdmins();

      if (admins && admins.length > 0) {
        const adminIds = admins
          .map((a) => a.auth_user_id)
          .filter(Boolean) as string[];
        await Promise.all(
          adminIds.map((adminId) =>
            NotificationService.notifyTimesheetSubmitted(
              adminId,
              userName,
              format(parseISO(shift.start_date), 'dd MMM yyyy'),
            ),
          ),
        );
      }

      toast.success('Timesheet submitted successfully');
      handleBack();
    } catch (error: any) {
      console.error('Timesheet submission error details:', error);
      toast.error(
        `Failed to submit timesheet: ${error.message || 'Unknown error'}`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="py-10 text-center text-sm text-muted-foreground">
          Loading shift...
        </div>
      </Container>
    );
  }
  if (!shift) {
    return (
      <Container>
        <div className="py-10 text-center text-sm text-muted-foreground">
          Shift not found.
        </div>
      </Container>
    );
  }

  const scheduledHrsDisplay = (scheduledMins / 60).toFixed(1);
  const actualHrsDisplay =
    actualMins !== null ? Math.max(0, actualMins / 60).toFixed(1) : '—';

  return (
    <>
      <Container>
        <Toolbar className="hidden sm:flex">
          <ToolbarHeading>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="-ml-2"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div>
                <ToolbarPageTitle
                  text={isReadOnly ? 'View Timesheet' : 'Submit Timesheet'}
                />
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
        <form
          onSubmit={handleSubmit}
          className="grid gap-5 lg:gap-7.5 max-w-2xl"
        >
          {isReadOnly && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
              <Info className="size-5 text-primary" />
              <p className="text-sm">
                This timesheet has been submitted and is currently{' '}
                <strong>{status}</strong>. It cannot be edited.
              </p>
            </div>
          )}

          <Card id="actual-hours" className="border-0 sm:border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-primary" />
                Actual Hours Worked
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Rostered: {shift.start_time.slice(0, 5)} –{' '}
                {shift.end_time.slice(0, 5)} ({scheduledHrsDisplay} hrs
                scheduled)
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
                  <span className="text-sm text-muted-foreground">
                    Total hours worked
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {actualHrsDisplay} hrs
                    </span>
                    {overtimeHours > 0 && (
                      <Badge
                        variant="warning"
                        appearance="light"
                        className="text-xs"
                      >
                        +{overtimeHours.toFixed(1)} hrs overtime
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              {overtimeHours > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="overtimeExplanation">
                    Overtime Explanation{' '}
                    <span
                      className={cn(isReadOnly ? 'hidden' : 'text-destructive')}
                    >
                      *
                    </span>
                  </Label>
                  <Textarea
                    id="overtimeExplanation"
                    value={overtimeExplanation}
                    onChange={(e) => setOvertimeExplanation(e.target.value)}
                    placeholder="Explain why overtime was required..."
                    rows={2}
                    className={
                      !isReadOnly && overtimeNeedsReason
                        ? 'border-destructive'
                        : ''
                    }
                    readOnly={isReadOnly}
                  />
                  {!isReadOnly && overtimeNeedsReason && (
                    <p className="text-xs text-destructive">
                      Required when overtime is claimed
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="additional-options" className="border-0 sm:border">
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
              </div>

              <div className="border-t pt-4">
                <label
                  className={cn(
                    'flex items-start gap-3 select-none',
                    isReadOnly ? 'cursor-default' : 'cursor-pointer',
                  )}
                >
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
                        Check this if you were unwell and this shift should be
                        converted to sick leave.
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

          <Card id="shift-notes" className="border-0 sm:border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-4 text-primary" />
                  Shift Notes
                </CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage shift notes for each participant on this shift.
              </p>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto border rounded-lg bg-white">
                <table className="table-fixed md:table-auto w-full text-left text-sm text-gray-700 dark:text-gray-300">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase font-bold text-muted-foreground bg-muted/20">
                      <th className="py-3 px-4">Participant</th>
                      <th className="py-3 px-4">Ref ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Modified</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {participantNotes.map((pn) => (
                      <tr key={pn.id} className="hover:bg-muted/10">
                        <td className="py-3 px-4 min-w-0">
                          {pn.id !== 'general' ? (
                            <Link
                              to={`${ROUTES.PARTICIPANT_DETAIL}/${pn.id}`}
                              className="flex items-center gap-2 group/participant w-fit"
                            >
                              <SecureAvatar
                                src={pn.photo_url}
                                initials={getInitials(pn.participant_name)}
                                className="size-6 shrink-0 transition-all group-hover/participant:ring-2 group-hover/participant:ring-primary/20"
                                bucket={STORAGE_BUCKETS.PARTICIPANT_PHOTOS}
                              />
                              <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover/participant:underline transition-colors truncate max-w-[150px] md:max-w-none">
                                {pn.participant_name}
                              </span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <div className="size-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                <FileText className="size-3 text-gray-500" />
                              </div>
                              <span className="text-sm font-medium text-gray-700 truncate">
                                {pn.participant_name}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                          {pn.reference_id || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              pn.status === 'Completed'
                                ? 'success'
                                : pn.status === 'Draft'
                                  ? 'warning'
                                  : 'destructive'
                            }
                            appearance="light"
                            className="text-[10px] font-bold uppercase shrink-0"
                          >
                            {pn.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          {pn.updated_at
                            ? format(
                                parseISO(pn.updated_at),
                                'dd MMM yyyy, HH:mm',
                              )
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-20 justify-center"
                            onClick={() =>
                              navigate(
                                `${ROUTES.SHIFT_NOTES_DETAIL}/${pn.noteId || 'new'}?shiftId=${shiftId}&staffId=${user?.staff_id || ''}${pn.id !== 'general' ? `&participantId=${pn.id}` : ''}`,
                                {
                                  state: {
                                    from:
                                      location.pathname +
                                      location.search +
                                      '#shift-notes',
                                  },
                                },
                              )
                            }
                          >
                            {isReadOnly ? (
                              'View'
                            ) : pn.noteId ? (
                              <>
                                <Pencil className="size-3 mr-1" />
                                <span>Edit</span>
                              </>
                            ) : (
                              '+ Add'
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {assignedChecklists.length > 0 && (
            <Card
              id="required-routines"
              className={cn(
                'border-0 sm:border',
                assignedChecklists.every((cl) => cl.status === 'completed')
                  ? 'border-green-200 bg-green-50/10'
                  : 'border-orange-200 bg-orange-50/10',
              )}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2
                    className={cn(
                      'size-4',
                      assignedChecklists.every(
                        (cl) => cl.status === 'completed',
                      )
                        ? 'text-green-600'
                        : 'text-orange-600',
                    )}
                  />
                  Required Shift Routines
                </CardTitle>
                {!isReadOnly && (
                  <p className="text-sm text-muted-foreground mt-1">
                    You must complete all routines assigned to your shift before
                    submitting your timesheet.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="divide-y border rounded-lg bg-white overflow-hidden">
                  {assignedChecklists.map((cl) => (
                    <div
                      key={cl.checklist_id}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            'size-2 rounded-full shrink-0',
                            cl.status === 'completed'
                              ? 'bg-green-500'
                              : 'bg-orange-400' +
                                  (!isReadOnly ? ' animate-pulse' : ''),
                          )}
                        />
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {cl.assignment_title}
                        </span>
                      </div>
                      <Badge
                        variant={
                          cl.status === 'completed' ? 'success' : 'warning'
                        }
                        appearance="light"
                        className="text-[10px] font-bold uppercase shrink-0"
                      >
                        {cl.status === 'completed' ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>

                {!isReadOnly &&
                  assignedChecklists.some(
                    (cl) => cl.status !== 'completed',
                  ) && (
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="primary"
                        className="w-full font-bold shadow-sm"
                        onClick={() => navigate(ROUTES.MY_CHECKLISTS)}
                      >
                        <ClipboardList className="size-4 me-2" />
                        Complete Checklists Now
                      </Button>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-3 pb-8">
            {!isReadOnly ? (
              <>
                <Button
                  type="submit"
                  disabled={saving}
                  className={cn(
                    'flex-1 sm:flex-none sm:min-w-[160px]',
                    assignedChecklists.some(
                      (cl) => cl.status !== 'completed',
                    ) && 'opacity-50 grayscale cursor-not-allowed',
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
