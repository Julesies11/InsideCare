import { useEffect } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import {
  IncidentPriority,
  IncidentReport,
  IncidentSeverity,
  IncidentStatus,
} from '@/models/incident-report';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { AlertCircle, Loader2, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { generateIncidentReferenceId } from '@/lib/incident-utils';
import { useIncidentTypesMaster } from '@/hooks/use-incident-types-master';
import { useParticipants } from '@/hooks/use-participants';
import { useRestrictivePracticeTypesMaster } from '@/hooks/use-restrictive-practice-types-master';
import { useStaff } from '@/hooks/use-staff';
import { ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const incidentSchema = z
  .object({
    reference_id: z.string().optional().nullable(),
    involved_participant_id: z.string().uuid().optional().nullable(),
    involved_staff_id: z.string().uuid().optional().nullable(),
    incident_date: z.string().min(1, 'Incident date and time is required'),
    incident_type_id: z.string().uuid('Please select an incident type'),
    severity: z.enum(['Low', 'Moderate', 'High']),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
    summary: z.string().min(5, 'Summary is required (min 5 characters)'),
    details: z.string().min(10, 'Details are required (min 10 characters)'),
    outcome: z.string().min(1, 'Outcome is required'),
    witnesses: z.string().optional().nullable(),
    notified_parties: z.string().optional().nullable(),

    is_restrictive_practice: z.boolean().default(false),
    restrictive_practice_type_id: z.string().uuid().optional().nullable(),
    restrictive_practice_description: z.string().optional().nullable(),
    rp_start_time: z.string().optional().nullable(),
    rp_end_time: z.string().optional().nullable(),
    rp_reason: z.string().optional().nullable(),
    rp_triggers: z.string().optional().nullable(),
    rp_observed_behaviours: z.string().optional().nullable(),
    rp_outcome: z.string().optional().nullable(),

    is_ndis_reportable: z.boolean().default(false),

    // Admin fields
    admin_status: z.enum(['New', 'Actioned', 'Referred', 'Closed']).optional(),
    admin_actions_taken: z.string().optional().nullable(),
    ndis_reported_date: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.is_restrictive_practice) {
      if (
        !data.restrictive_practice_type_id ||
        data.restrictive_practice_type_id.trim() === ''
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please select a restrictive practice type',
          path: ['restrictive_practice_type_id'],
        });
      }
      if (
        !data.restrictive_practice_description ||
        data.restrictive_practice_description.trim() === ''
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Description of the restraint used is required',
          path: ['restrictive_practice_description'],
        });
      }
      if (!data.rp_start_time || data.rp_start_time.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start time is required',
          path: ['rp_start_time'],
        });
      }
      if (!data.rp_end_time || data.rp_end_time.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End time is required',
          path: ['rp_end_time'],
        });
      } else if (
        data.rp_start_time &&
        new Date(data.rp_end_time) < new Date(data.rp_start_time)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End time must be after start time',
          path: ['rp_end_time'],
        });
      }
    }
  });

type IncidentFormData = z.infer<typeof incidentSchema>;

interface IncidentFormProps {
  initialData?: Partial<IncidentReport>;
  onSave: (data: IncidentFormData) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export function IncidentForm({
  initialData,
  onSave,
  onCancel,
  isSaving,
}: IncidentFormProps) {
  const { user } = useAuth();
  const { hasAccess } = useRBAC();

  const canManageIncidents = hasAccess({
    resource: RBAC_MODULES.INCIDENT_MANAGEMENT,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const { participants = [], isLoading: loadingParticipants } = useParticipants(
    0,
    1000,
    [],
    { statuses: ['active'] },
  );
  const { staff: staffList = [], isLoading: loadingStaff } = useStaff(
    0,
    1000,
    [],
    { statuses: ['active'] },
  );
  const { data: incidentTypes = [], isLoading: loadingIncidentTypes } =
    useIncidentTypesMaster();
  const { data: restrictivePracticeTypes = [], isLoading: loadingRPTypes } =
    useRestrictivePracticeTypesMaster();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      involved_participant_id: initialData?.involved_participant_id || null,
      involved_staff_id: initialData?.involved_staff_id || user?.staff_id || null,
      incident_date: initialData?.incident_date
        ? format(new Date(initialData.incident_date), "yyyy-MM-dd'T'HH:mm")
        : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      incident_type_id: initialData?.incident_type_id || '',
      severity: initialData?.severity || 'Moderate',
      priority: initialData?.priority || 'Medium',
      summary: initialData?.summary || '',
      details: initialData?.details || '',
      outcome: initialData?.outcome || '',
      witnesses: initialData?.witnesses || (initialData as any)?.staff?.staff_name || '',
      notified_parties: initialData?.notified_parties || '',
      is_restrictive_practice: initialData?.is_restrictive_practice || false,
      restrictive_practice_type_id:
        initialData?.restrictive_practice_type_id || null,
      restrictive_practice_description:
        initialData?.restrictive_practice_description || '',
      rp_start_time: initialData?.rp_start_time
        ? format(new Date(initialData.rp_start_time), "yyyy-MM-dd'T'HH:mm")
        : '',
      rp_end_time: initialData?.rp_end_time
        ? format(new Date(initialData.rp_end_time), "yyyy-MM-dd'T'HH:mm")
        : '',
      rp_reason: initialData?.rp_reason || '',
      rp_triggers: initialData?.rp_triggers || '',
      rp_observed_behaviours: initialData?.rp_observed_behaviours || '',
      rp_outcome: initialData?.rp_outcome || '',
      is_ndis_reportable: initialData?.is_ndis_reportable || false,
      admin_status: initialData?.admin_status || 'New',
      admin_actions_taken: initialData?.admin_actions_taken || '',
      ndis_reported_date: initialData?.ndis_reported_date || '',
      reference_id: initialData?.reference_id || '',
    },
  });

  const isRP = watch('is_restrictive_practice');
  const isNDIS = watch('is_ndis_reportable');
  const currentInvolvedStaffId = watch('involved_staff_id');

  useEffect(() => {
    if (!currentInvolvedStaffId && !initialData?.involved_staff_id) {
      if (user?.staff_id) {
        setValue('involved_staff_id', user.staff_id);
      } else if (staffList.length > 0) {
        setValue('involved_staff_id', staffList[0].id);
      }
    }
  }, [currentInvolvedStaffId, initialData?.involved_staff_id, user?.staff_id, staffList, setValue]);

  const onSubmit = async (data: IncidentFormData) => {
    const fallbackStaffId =
      user?.staff_id ||
      (staffList.length > 0 ? staffList[0].id : null) ||
      initialData?.involved_staff_id ||
      initialData?.reported_by;

    // Sanitize empty strings to null for optional fields
    const sanitizedData: any = {
      ...data,
      involved_participant_id: data.involved_participant_id || null,
      involved_staff_id: data.involved_staff_id || fallbackStaffId,
      restrictive_practice_type_id: data.restrictive_practice_type_id || null,
      rp_start_time: data.rp_start_time || null,
      rp_end_time: data.rp_end_time || null,
      ndis_reported_date: data.ndis_reported_date || null,
    };

    // Add reported_by if this is a new incident
    if (!initialData?.id && user?.staff_id) {
      sanitizedData.reported_by = user.staff_id;
    } else if (!sanitizedData.reported_by && fallbackStaffId) {
      sanitizedData.reported_by = fallbackStaffId;
    }

    // Generate reference_id if new
    if (!initialData?.id) {
      const participant = participants.find(
        (p) => p.id === data.involved_participant_id,
      );
      const participantName = participant ? participant.participant_name : '';
      sanitizedData.reference_id = generateIncidentReferenceId({
        incidentDate: data.incident_date,
        participantName,
      });
    } else {
      sanitizedData.reference_id = initialData.reference_id || null;
    }

    await onSave(sanitizedData);
  };

  if (
    loadingParticipants ||
    loadingStaff ||
    loadingIncidentTypes ||
    loadingRPTypes
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-gray-500">
          Loading form data...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Involved Parties & Timing */}
          <Card>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-base font-bold">
                Involved Parties & Timing
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {initialData?.reference_id && (
                <div className="bg-gray-50 border border-border p-3 rounded-lg flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Incident ID (Reference ID)
                    </span>
                    <span className="font-mono text-sm font-bold text-gray-900">
                      {initialData.reference_id}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="font-bold uppercase tracking-wider text-[9px] bg-white"
                  >
                    Generated System ID
                  </Badge>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Participant{' '}
                    <span className="text-muted-foreground text-xs">
                      (optional)
                    </span>
                  </Label>
                  <Select
                    value={watch('involved_participant_id') || 'none'}
                    onValueChange={(val) =>
                      setValue(
                        'involved_participant_id',
                        val === 'none' ? null : val,
                      )
                    }
                  >
                    <SelectTrigger
                      className={
                        errors.involved_participant_id
                          ? 'border-destructive'
                          : ''
                      }
                    >
                      <SelectValue placeholder="Select participant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None / General</SelectItem>
                      {participants.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            <SecureAvatar
                              src={p.photo_url}
                              alt={p.participant_name}
                              className="size-6"
                              bucket={STORAGE_BUCKETS.PARTICIPANT_PHOTOS}
                            />
                            <span>{p.participant_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.involved_participant_id && (
                    <p className="text-xs text-destructive">
                      {errors.involved_participant_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Involved Staff <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watch('involved_staff_id') || ''}
                    onValueChange={(val) => setValue('involved_staff_id', val)}
                  >
                    <SelectTrigger
                      className={
                        errors.involved_staff_id ? 'border-destructive' : ''
                      }
                    >
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2">
                            <SecureAvatar
                              src={s.photo_url}
                              alt={s.staff_name}
                              className="size-6"
                            />
                            <span>{s.staff_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.involved_staff_id && (
                    <p className="text-xs text-destructive">
                      {errors.involved_staff_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Witnesses <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    type="text"
                    {...register('witnesses')}
                    placeholder="Enter witness names (if any)"
                    className={errors.witnesses ? 'border-destructive' : ''}
                  />
                  {errors.witnesses && (
                    <p className="text-xs text-destructive">
                      {errors.witnesses.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Incident Date & Time{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    {...register('incident_date')}
                    className={errors.incident_date ? 'border-destructive' : ''}
                  />
                  {errors.incident_date && (
                    <p className="text-xs text-destructive">
                      {errors.incident_date.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Date & Time Lodged</Label>
                  <div className="h-10 px-3 flex items-center bg-gray-50 border border-border rounded-lg text-sm text-gray-700 font-medium font-sans">
                    {initialData?.created_at
                      ? format(
                          new Date(initialData.created_at),
                          'dd MMM yyyy HH:mm',
                        )
                      : `${format(new Date(), 'dd MMM yyyy HH:mm')} (auto-set on submit)`}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Reported By</Label>
                  <div className="flex items-center gap-3 p-2.5 bg-gray-50 border border-border rounded-lg">
                    <SecureAvatar
                      src={user?.photo_url}
                      alt={user?.staff_name || 'System User'}
                      className="size-10"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">
                        {user?.staff_name || 'System User'}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                        {user?.role_name || 'Staff Member'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Classification */}
          <Card>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-base font-bold">
                Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>
                    Incident Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watch('incident_type_id')}
                    onValueChange={(val) => setValue('incident_type_id', val)}
                  >
                    <SelectTrigger
                      className={
                        errors.incident_type_id ? 'border-destructive' : ''
                      }
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {incidentTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.incident_type_id && (
                    <p className="text-xs text-destructive">
                      {errors.incident_type_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Severity <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watch('severity')}
                    onValueChange={(val) =>
                      setValue('severity', val as IncidentSeverity)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Priority <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watch('priority')}
                    onValueChange={(val) =>
                      setValue('priority', val as IncidentPriority)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: The Incident */}
          <Card>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-base font-bold">
                Incident Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>
                  Summary <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register('summary')}
                  placeholder="Short, descriptive summary (e.g. Participant refusal of morning medications)"
                  className={errors.summary ? 'border-destructive' : ''}
                />
                {errors.summary && (
                  <p className="text-xs text-destructive">
                    {errors.summary.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Full Details <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  {...register('details')}
                  placeholder="Provide a chronological account of the incident..."
                  rows={6}
                  className={errors.details ? 'border-destructive' : ''}
                />
                {errors.details && (
                  <p className="text-xs text-destructive">
                    {errors.details.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Outcome <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  {...register('outcome')}
                  placeholder="What was the immediate result or resolution?"
                  rows={3}
                  className={errors.outcome ? 'border-destructive' : ''}
                />
                {errors.outcome && (
                  <p className="text-xs text-destructive">
                    {errors.outcome.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Who was notified?{' '}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  {...register('notified_parties')}
                  placeholder="Guardian, GP, Pharmacist, etc."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Section 4: Restrictive Practice */}
          <Card
            className={isRP ? 'border-primary shadow-md transition-all' : ''}
          >
            <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">
                Restrictive Practice
              </CardTitle>
              <Switch
                checked={isRP}
                onCheckedChange={(val) =>
                  setValue('is_restrictive_practice', val)
                }
              />
            </CardHeader>
            {isRP && (
              <CardContent className="pt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <Label>
                    Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watch('restrictive_practice_type_id') || ''}
                    onValueChange={(val) =>
                      setValue('restrictive_practice_type_id', val)
                    }
                  >
                    <SelectTrigger
                      className={
                        errors.restrictive_practice_type_id
                          ? 'border-destructive'
                          : ''
                      }
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {restrictivePracticeTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.restrictive_practice_type_id && (
                    <p className="text-xs text-destructive">
                      {errors.restrictive_practice_type_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    {...register('restrictive_practice_description')}
                    placeholder="Specific details of the restraint used..."
                    rows={3}
                    className={
                      errors.restrictive_practice_description
                        ? 'border-destructive'
                        : ''
                    }
                  />
                  {errors.restrictive_practice_description && (
                    <p className="text-xs text-destructive">
                      {errors.restrictive_practice_description.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Start Time <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      {...register('rp_start_time')}
                      className={
                        errors.rp_start_time ? 'border-destructive' : ''
                      }
                    />
                    {errors.rp_start_time && (
                      <p className="text-xs text-destructive">
                        {errors.rp_start_time.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      End Time <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      {...register('rp_end_time')}
                      className={errors.rp_end_time ? 'border-destructive' : ''}
                    />
                    {errors.rp_end_time && (
                      <p className="text-xs text-destructive">
                        {errors.rp_end_time.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reason Used</Label>
                  <Textarea {...register('rp_reason')} rows={2} />
                </div>

                <div className="space-y-2">
                  <Label>Triggers & Warning Signs</Label>
                  <Textarea {...register('rp_triggers')} rows={2} />
                </div>

                <div className="space-y-2">
                  <Label>Behaviours of Concern Observed</Label>
                  <Textarea {...register('rp_observed_behaviours')} rows={2} />
                </div>

                <div className="space-y-2">
                  <Label>Participant Response/Outcome</Label>
                  <Textarea {...register('rp_outcome')} rows={2} />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Section 5: NDIS Reportable */}
          <Card className={isNDIS ? 'border-destructive bg-destructive/5' : ''}>
            <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-destructive">
                  NDIS Reportable
                </CardTitle>
                {isNDIS && (
                  <AlertCircle className="size-4 text-destructive animate-pulse" />
                )}
              </div>
              <Switch
                checked={isNDIS}
                onCheckedChange={(val) => setValue('is_ndis_reportable', val)}
              />
            </CardHeader>
            {isNDIS && (
              <CardContent className="pt-4">
                <p className="text-xs text-destructive font-medium leading-relaxed italic">
                  Marking this as an NDIS Reportable incident will flag it for
                  priority administrative review. Please ensure all details are
                  accurate as this may be submitted to the NDIS Commission.
                </p>
              </CardContent>
            )}
          </Card>

          {/* Section 6: Admin Actions */}
          {canManageIncidents && (
            <Card className="border-primary/50 bg-primary/5 shadow-inner">
              <CardHeader className="py-4 border-b bg-primary/10">
                <CardTitle className="text-base font-bold text-primary">
                  Admin Section
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Resolution Status</Label>
                  <Select
                    value={watch('admin_status')}
                    onValueChange={(val) =>
                      setValue('admin_status', val as IncidentStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New / Under Review</SelectItem>
                      <SelectItem value="Actioned">Actioned</SelectItem>
                      <SelectItem value="Referred">Referred</SelectItem>
                      <SelectItem value="Closed">Closed / Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Actions Taken & Follow-up</Label>
                  <Textarea
                    {...register('admin_actions_taken')}
                    placeholder="Document administrative actions, referrals, and final resolution..."
                    rows={4}
                  />
                </div>

                {isNDIS && (
                  <div className="space-y-2">
                    <Label>Date Reported to NDIS Commission</Label>
                    <Input type="date" {...register('ndis_reported_date')} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="sticky bottom-6 pt-4 flex flex-col gap-3">
            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 font-bold shadow-lg"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 me-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4 me-2" />
                  {initialData?.id ? 'Update Report' : 'Submit Incident Report'}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 font-bold"
              onClick={onCancel}
              disabled={isSaving}
            >
              <X className="size-4 me-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
