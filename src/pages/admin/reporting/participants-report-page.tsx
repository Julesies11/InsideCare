import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { differenceInYears, format } from 'date-fns';
import {
  ArrowLeft,
  Building,
  Check,
  Filter,
  Loader2,
  Printer,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { cn } from '@/lib/utils';
import { useActivityLog } from '@/hooks/use-activity-log';
import { useParticipantContacts } from '@/hooks/use-participant-contacts';
import { useParticipantDocuments } from '@/hooks/use-participant-documents';
import { useParticipantGoals } from '@/hooks/use-participant-goals';
import { useParticipantMedications } from '@/hooks/use-participant-medications';
import { useParticipant, useParticipants } from '@/hooks/use-participants';
import {
  useReportPreferences,
  useSaveReportPreferences,
} from '@/hooks/use-report-preferences';
import { useShiftNotesByParticipantId } from '@/hooks/use-shift-notes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Container } from '@/components/common/container';
import { PrintableReport } from '@/components/common/printable-report';

export function ParticipantsReportPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const {
    preferences,
    isLoading: isLoadingPreferences,
    isSuccess,
  } = useReportPreferences(user?.staff_id, 'participant_profile');
  const savePreference = useSaveReportPreferences();

  // State for selected participant
  const [selectedId, setSelectedId] = useState<string>('');

  // Section toggle states matching exactly with the Participant Detail page sections
  const [sections, setSections] = useState({
    personal: true,
    goals: true,
    behaviour: true,
    supportNeeds: true,
    mealtime: true,
    clinical: true,
    trackers: true,
    medicalRoutine: true,
    medications: true,
    emergency: true,
    contacts: true,
    documents: false, // Default false to exclude bulky files
    shiftNotes: false, // Default false to exclude bulky logs
    activityLog: false, // Default false
  });

  // Track if preferences have been loaded/applied
  const [prefLoaded, setPrefLoaded] = useState(false);

  // Sync preferences on load
  useEffect(() => {
    if (isSuccess && !prefLoaded) {
      if (preferences) {
        if (preferences.sections) {
          setSections(preferences.sections);
        }
        // Only set selectedId from preferences if there is no URL param
        if (!id && preferences.participantId) {
          setSelectedId(preferences.participantId);
        }
      }
      setPrefLoaded(true);
    }
  }, [isSuccess, preferences, id, prefLoaded]);

  // Sync route ID to selection (overrides preference if present)
  useEffect(() => {
    if (id) {
      setSelectedId(id);
    }
  }, [id]);

  // Helper to save report criteria to the database
  const saveCriteria = (
    updatedSections: typeof sections,
    updatedId: string,
  ) => {
    if (user?.staff_id) {
      savePreference.mutate({
        staffId: user.staff_id,
        reportType: 'participant_profile',
        criteria: {
          sections: updatedSections,
          participantId: updatedId,
        },
      });
    }
  };

  // Dynamically calculate section numbers based on visible sections
  const sectionNumbers = useMemo(() => {
    const order: (keyof typeof sections)[] = [
      'personal',
      'goals',
      'behaviour',
      'supportNeeds',
      'mealtime',
      'clinical',
      'trackers',
      'medicalRoutine',
      'medications',
      'emergency',
      'contacts',
      'documents',
      'shiftNotes',
      'activityLog',
    ];

    const nums: Partial<Record<keyof typeof sections, number>> = {};
    let currentNum = 1;

    order.forEach((key) => {
      if (sections[key]) {
        nums[key] = currentNum++;
      }
    });

    return nums;
  }, [sections]);

  // Fetch all participants for the selection dropdown
  const { participants: allParticipants, loading: isLoadingAll } =
    useParticipants(0, 1000, [{ id: 'participant', desc: false }], {
      statuses: ['active', 'draft', 'inactive'],
    });

  // Fetch single participant details
  const { participant, loading: isLoadingParticipant } = useParticipant(
    selectedId || undefined,
  );

  // Fetch Child Entities (conditional on selection)
  const { medications = [], loading: isLoadingMeds } =
    useParticipantMedications(selectedId || undefined);

  const { data: goalsData, isLoading: isLoadingGoals } = useParticipantGoals(
    selectedId || undefined,
  );
  const goals = goalsData?.goals || [];
  const goalProgress = goalsData?.progress || [];

  const { data: contacts = [], isLoading: isLoadingContacts } =
    useParticipantContacts(selectedId || undefined);

  const { data: documents = [], isLoading: isLoadingDocs } =
    useParticipantDocuments(selectedId || undefined);

  const { shiftNotes = [], loading: isLoadingNotes } =
    useShiftNotesByParticipantId(selectedId || undefined);

  const { activities = [], loading: isLoadingActivities } = useActivityLog(
    useMemo(
      () => ({
        entityId: selectedId || undefined,
        entityType: 'participant',
        pageSize: 50, // Limit activities count in report
      }),
      [selectedId],
    ),
  );

  const handlePrint = () => {
    window.print();
  };

  const toggleSection = (sectionKey: keyof typeof sections) => {
    const nextSections = {
      ...sections,
      [sectionKey]: !sections[sectionKey],
    };
    setSections(nextSections);
    saveCriteria(nextSections, selectedId);
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateAge = (dobString?: string | null) => {
    if (!dobString) return '';
    try {
      const birth = new Date(dobString);
      if (isNaN(birth.getTime())) return '';
      const age = differenceInYears(new Date(), birth);
      return `${age} yrs`;
    } catch {
      return '';
    }
  };

  const formatDOB = (dobString?: string | null) => {
    if (!dobString) return '-';
    try {
      const date = new Date(dobString);
      if (isNaN(date.getTime())) return '-';
      return format(date, 'dd MMM yyyy');
    } catch {
      return '-';
    }
  };

  const formatByteSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isDataLoading =
    isLoadingParticipant ||
    isLoadingMeds ||
    isLoadingGoals ||
    isLoadingContacts ||
    isLoadingDocs ||
    isLoadingNotes ||
    isLoadingActivities ||
    isLoadingPreferences;

  return (
    <Container className="pt-2 pb-6 max-w-full lg:px-10 text-gray-900">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Criteria (hidden on print) */}
          <div className="lg:col-span-3 space-y-4 no-print">
            <div className="sticky top-6 space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.REPORTING)}
                className="w-fit transition-colors hover:bg-gray-100"
              >
                <ArrowLeft className="size-4 me-1.5" />
                Back to Reports
              </Button>

              <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <CardTitle className="text-base flex items-center gap-2 font-sans font-bold">
                    <Filter className="size-4 text-primary" /> Report Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Participant Dropdown Selector with Avatar */}
                  <div className="space-y-2 flex flex-col">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest font-sans">
                      Select Participant
                    </label>
                    <Select
                      value={selectedId}
                      onValueChange={(val) => {
                        setSelectedId(val);
                        saveCriteria(sections, val);
                      }}
                      disabled={isLoadingAll}
                    >
                      <SelectTrigger className="h-10 text-xs font-sans">
                        <SelectValue placeholder="Search / Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allParticipants.map((p) => (
                          <SelectItem
                            key={p.id}
                            value={p.id}
                            className="text-xs"
                          >
                            <div className="flex items-center justify-between w-full gap-2">
                              <div className="flex items-center gap-2.5 truncate">
                                <SecureAvatar
                                  src={p.photo_url}
                                  initials={getInitials(p.participant_name)}
                                  className="size-5 shrink-0 rounded-full"
                                  bucket={STORAGE_BUCKETS.PARTICIPANT_PHOTOS}
                                />
                                <span className="truncate font-medium">
                                  {p.participant_name}
                                </span>
                              </div>
                              {p.status === 'draft' && (
                                <Badge
                                  variant="warning"
                                  appearance="light"
                                  size="xs"
                                  className="uppercase font-bold text-[8px] font-sans shrink-0"
                                >
                                  Draft
                                </Badge>
                              )}
                              {p.status === 'inactive' && (
                                <Badge
                                  variant="destructive"
                                  appearance="light"
                                  size="xs"
                                  className="uppercase font-bold text-[8px] font-sans shrink-0"
                                >
                                  Inactive
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Section Checklist Toggles matching exact Detail Page Sections */}
                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest font-sans block mb-1">
                      Included Sections
                    </label>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="sec-personal"
                          checked={sections.personal}
                          onCheckedChange={() => toggleSection('personal')}
                        />
                        <Label
                          htmlFor="sec-personal"
                          className="text-xs font-normal cursor-pointer"
                        >
                          Personal Details
                        </Label>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="sec-goals"
                          checked={sections.goals}
                          onCheckedChange={() => toggleSection('goals')}
                        />
                        <Label
                          htmlFor="sec-goals"
                          className="text-xs font-normal cursor-pointer"
                        >
                          Goals
                        </Label>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="sec-behaviour"
                          checked={sections.behaviour}
                          onCheckedChange={() => toggleSection('behaviour')}
                        />
                        <Label
                          htmlFor="sec-behaviour"
                          className="text-xs font-normal cursor-pointer"
                        >
                          Behaviour & Support
                        </Label>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="sec-supportNeeds"
                          checked={sections.supportNeeds}
                          onCheckedChange={() => toggleSection('supportNeeds')}
                        />
                        <Label
                          htmlFor="sec-supportNeeds"
                          className="text-xs font-normal cursor-pointer"
                        >
                          Support Needs
                        </Label>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="sec-mealtime"
                          checked={sections.mealtime}
                          onCheckedChange={() => toggleSection('mealtime')}
                        />
                        <Label
                          htmlFor="sec-mealtime"
                          className="text-xs font-normal cursor-pointer"
                        >
                          Mealtime Management
                        </Label>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="sec-clinical"
                          checked={sections.clinical}
                          onCheckedChange={() => toggleSection('clinical')}
                        />
                        <Label
                          htmlFor="sec-clinical"
                          className="text-xs font-normal cursor-pointer"
                        >
                          Clinical Details
                        </Label>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="sec-trackers"
                          checked={sections.trackers}
                          onCheckedChange={() => toggleSection('trackers')}
                        />
                        <Label
                          htmlFor="sec-trackers"
                          className="text-xs font-normal cursor-pointer"
                        >
                          Clinical Trackers
                        </Label>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="sec-medicalRoutine"
                          checked={sections.medicalRoutine}
                          onCheckedChange={() =>
                            toggleSection('medicalRoutine')
                          }
                        />
                        <Label
                          htmlFor="sec-medicalRoutine"
                          className="text-xs font-normal cursor-pointer"
                        >
                          Medical Routine
                        </Label>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="sec-medications"
                          checked={sections.medications}
                          onCheckedChange={() => toggleSection('medications')}
                        />
                        <Label
                          htmlFor="sec-medications"
                          className="text-xs font-normal cursor-pointer"
                        >
                          Medications
                        </Label>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="sec-emergency"
                          checked={sections.emergency}
                          onCheckedChange={() => toggleSection('emergency')}
                        />
                        <Label
                          htmlFor="sec-emergency"
                          className="text-xs font-normal cursor-pointer"
                        >
                          Emergency Management
                        </Label>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="sec-contacts"
                          checked={sections.contacts}
                          onCheckedChange={() => toggleSection('contacts')}
                        />
                        <Label
                          htmlFor="sec-contacts"
                          className="text-xs font-normal cursor-pointer"
                        >
                          Contacts
                        </Label>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="sec-documents"
                          checked={sections.documents}
                          onCheckedChange={() => toggleSection('documents')}
                        />
                        <Label
                          htmlFor="sec-documents"
                          className="text-xs font-normal cursor-pointer text-blue-600 font-bold"
                        >
                          Documents
                        </Label>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="sec-notes"
                          checked={sections.shiftNotes}
                          onCheckedChange={() => toggleSection('shiftNotes')}
                        />
                        <Label
                          htmlFor="sec-notes"
                          className="text-xs font-normal cursor-pointer"
                        >
                          Shift Notes
                        </Label>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="sec-activity"
                          checked={sections.activityLog}
                          onCheckedChange={() => toggleSection('activityLog')}
                        />
                        <Label
                          htmlFor="sec-activity"
                          className="text-xs font-normal cursor-pointer"
                        >
                          Activity Log
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                    <Button
                      variant="primary"
                      onClick={handlePrint}
                      disabled={!selectedId || isDataLoading}
                      className="w-full font-bold shadow-sm"
                    >
                      <Printer className="size-4 me-2" />
                      Print Preview
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-xs text-gray-500 hover:text-primary font-sans transition-colors"
                      onClick={() => {
                        const resetSections = {
                          personal: true,
                          goals: true,
                          behaviour: true,
                          supportNeeds: true,
                          mealtime: true,
                          clinical: true,
                          trackers: true,
                          medicalRoutine: true,
                          medications: true,
                          emergency: true,
                          contacts: true,
                          documents: false,
                          shiftNotes: false,
                          activityLog: false,
                        };
                        setSections(resetSections);
                        saveCriteria(resetSections, selectedId);
                      }}
                    >
                      <X className="size-3 me-2" />
                      Reset Sections
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100/50">
                <h4 className="text-blue-900 font-bold text-sm mb-2 font-sans">
                  InsideCare Profile Report
                </h4>
                <p className="text-blue-700/70 text-xs leading-relaxed font-sans">
                  Toggle sections in the checklist to compile a customized
                  print-ready clinical report for the selected participant.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Report Preview */}
          <div className="lg:col-span-9 bg-gray-100/50 rounded-2xl border border-gray-200 min-h-[1000px] flex flex-col items-center py-4 px-4 overflow-hidden relative shadow-inner print:bg-transparent print:border-none print:shadow-none print:p-0">
            {isDataLoading && selectedId && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest font-sans">
                    Fetching Profile Data...
                  </span>
                </div>
              </div>
            )}

            <div className="w-full max-w-[210mm] print:m-0 print:p-0">
              {participant ? (
                <PrintableReport
                  title="Participant Clinical Profile"
                  subtitle="InsideCare Compiled Client Care Plan"
                  parameters={{
                    Participant: participant.participant_name || '',
                    House: participant.house_name || 'Unassigned',
                    'NDIS ID': participant.ndis_number || 'N/A',
                  }}
                >
                  <div className="space-y-12 pt-4 font-sans text-gray-900">
                    {/* Section: Personal Details */}
                    {sections.personal && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-900 pb-2.5">
                          {sectionNumbers.personal}. Personal Details
                        </h3>

                        <div className="flex gap-6 items-start pb-4">
                          <SecureAvatar
                            src={participant.photo_url}
                            initials={getInitials(participant.participant_name)}
                            className="size-24 border-2 border-gray-200 shadow-sm shrink-0 rounded-lg object-cover"
                            bucket={STORAGE_BUCKETS.PARTICIPANT_PHOTOS}
                          />
                          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs grow">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Full Name *
                              </span>
                              <Link
                                to={`${ROUTES.PARTICIPANT_DETAIL}/${participant.id}`}
                                className="font-semibold text-blue-700 hover:underline"
                              >
                                {participant.participant_name}
                              </Link>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                House
                              </span>
                              {participant.house_id ? (
                                <Link
                                  to={`${ROUTES.HOUSE_DETAIL}/${participant.house_id}`}
                                  className="font-semibold text-blue-700 hover:underline"
                                >
                                  {participant.house_name}
                                </Link>
                              ) : (
                                <span className="font-semibold text-gray-700 italic">
                                  Unassigned
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                NDIS Number
                              </span>
                              <span className="font-semibold text-gray-700">
                                {participant.ndis_number || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Date of Birth
                              </span>
                              <span className="font-semibold text-gray-700">
                                {formatDOB(participant.date_of_birth)}{' '}
                                {participant.date_of_birth &&
                                  `(${calculateAge(participant.date_of_birth)})`}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                House Phone
                              </span>
                              <span className="font-semibold text-gray-700">
                                {participant.house_phone || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Personal Mobile
                              </span>
                              <span className="font-semibold text-gray-700">
                                {participant.personal_mobile || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Email {participant.status !== 'draft' && '*'}
                              </span>
                              <span className="font-semibold text-gray-700">
                                {participant.email || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Support Level
                              </span>
                              <span className="font-semibold text-gray-700 capitalize">
                                {participant.support_level || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Support Coordinator
                              </span>
                              <span className="font-semibold text-gray-700">
                                {participant.support_coordinator || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Status
                              </span>
                              <span className="font-semibold text-gray-700 capitalize">
                                {participant.status || '-'}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Address
                              </span>
                              <span className="font-semibold text-gray-700">
                                {participant.address || '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section: Goals */}
                    {sections.goals && (
                      <div className="space-y-4 print:break-inside-avoid">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-900 pb-2.5">
                          {sectionNumbers.goals}. Goals
                        </h3>

                        <div className="space-y-3">
                          {goals.map((goal) => {
                            const progressNotes = goalProgress.filter(
                              (p) => p.goal_id === goal.id,
                            );
                            return (
                              <div
                                key={goal.id}
                                className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 space-y-2.5"
                              >
                                <div className="flex justify-between items-start gap-3">
                                  <h4 className="font-semibold text-gray-900 text-xs grow leading-relaxed">
                                    {goal.description}
                                  </h4>
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 shrink-0 tracking-wider">
                                    {goal.goal_type}
                                  </span>
                                </div>

                                {progressNotes.length > 0 && (
                                  <div className="border-t border-gray-200 pt-2.5 mt-2.5 space-y-2">
                                    <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                      Progress Log
                                    </span>
                                    {progressNotes.slice(-2).map((p) => (
                                      <div
                                        key={p.id}
                                        className="text-[11px] leading-relaxed text-gray-600 bg-white p-2 rounded border border-gray-100"
                                      >
                                        <p className="italic">
                                          "{p.progress_note}"
                                        </p>
                                        {p.created_at && (
                                          <span className="text-[9px] text-gray-400 block mt-1 font-mono">
                                            Recorded:{' '}
                                            {format(
                                              new Date(p.created_at),
                                              'dd MMM yyyy HH:mm',
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {goals.length === 0 && (
                            <div className="border border-gray-100 p-8 rounded-xl bg-gray-50/50 text-center text-gray-400 italic text-xs">
                              No care plan goals listed.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Section: Behaviour & Support */}
                    {sections.behaviour && (
                      <div className="space-y-4 print:break-inside-avoid">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-900 pb-2.5">
                          {sectionNumbers.behaviour}. Behaviour & Support
                        </h3>
                        <div className="grid grid-cols-2 gap-6 text-xs">
                          <div className="space-y-3">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Behaviour of Concern
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.behaviour_of_concern ||
                                  'None recorded'}
                              </p>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Restrictive Practice Details
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.restrictive_practice_details ||
                                  'None recorded'}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                            <div className="grid grid-cols-2 gap-y-2">
                              <span className="text-gray-500">
                                PBSP Engaged:
                              </span>
                              <span className="font-semibold text-gray-900">
                                {participant.pbsp_engaged ? 'Yes' : 'No'}
                              </span>

                              <span className="text-gray-500">
                                BSP Available:
                              </span>
                              <span className="font-semibold text-gray-900">
                                {participant.bsp_available ? 'Yes' : 'No'}
                              </span>

                              <span className="text-gray-500">
                                Restrictive Practices:
                              </span>
                              <span className="font-semibold text-gray-900">
                                {participant.restrictive_practices_yn
                                  ? 'Yes'
                                  : 'No'}
                              </span>

                              <span className="text-gray-500">
                                Restrictive Practice Authorisation:
                              </span>
                              <span className="font-semibold text-gray-900">
                                {participant.restrictive_practice_authorisation
                                  ? 'Yes'
                                  : 'No'}
                              </span>
                            </div>

                            {(participant.specialist_name ||
                              participant.specialist_phone ||
                              participant.specialist_email) && (
                              <div className="border-t border-gray-200 pt-2.5 mt-2.5">
                                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                  Specialist Name
                                </span>
                                <p className="text-gray-800 font-semibold mt-0.5">
                                  {participant.specialist_name || '-'}
                                </p>
                                <div className="mt-1 space-y-0.5 text-[11px] text-gray-500">
                                  {participant.specialist_phone && (
                                    <p>
                                      Specialist Phone:{' '}
                                      {participant.specialist_phone}
                                    </p>
                                  )}
                                  {participant.specialist_email && (
                                    <p>
                                      Specialist Email:{' '}
                                      {participant.specialist_email}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section: Support Needs */}
                    {sections.supportNeeds && (
                      <div className="space-y-4 print:break-inside-avoid">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-900 pb-2.5">
                          {sectionNumbers.supportNeeds}. Support Needs
                        </h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs">
                          {participant.routine && (
                            <div className="col-span-2">
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Routine
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.routine}
                              </p>
                            </div>
                          )}
                          {participant.hygiene_support && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Hygiene Support Required
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.hygiene_support}
                              </p>
                            </div>
                          )}
                          {participant.mobility_support && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Mobility Support Required
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.mobility_support}
                              </p>
                            </div>
                          )}
                          {participant.meal_prep_support && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Meal Preparation Support Needs
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.meal_prep_support}
                              </p>
                            </div>
                          )}
                          {participant.household_support && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Household Support Needs
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.household_support}
                              </p>
                            </div>
                          )}
                          {(participant.communication_type ||
                            participant.communication_notes) && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Communication
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5">
                                <strong>Preferred Communication Type:</strong>{' '}
                                <span className="capitalize">
                                  {participant.communication_type || 'verbal'}
                                </span>
                                <br />
                                <strong>Communication Type Notes:</strong>{' '}
                                {participant.communication_notes || '-'}
                              </p>
                            </div>
                          )}
                          {participant.communication_language_needs && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Communication & Language Needs
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.communication_language_needs}
                              </p>
                            </div>
                          )}
                          {participant.finance_support && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Finance Support Needs
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.finance_support}
                              </p>
                            </div>
                          )}
                          {participant.health_wellbeing_support && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Health & Wellbeing Support Needs
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.health_wellbeing_support}
                              </p>
                            </div>
                          )}
                          {participant.cultural_religious_support && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Cultural and Religious Support Needs
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.cultural_religious_support}
                              </p>
                            </div>
                          )}
                          {participant.other_support && (
                            <div className="col-span-2">
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Any Other Support Needs
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.other_support}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Section: Mealtime Management */}
                    {sections.mealtime && (
                      <div className="space-y-4 print:break-inside-avoid">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-900 pb-2.5">
                          {sectionNumbers.mealtime}. Mealtime Management
                        </h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                              Is there a MTMP?
                            </span>
                            <span className="font-semibold text-gray-700">
                              {participant.mtmp_required ? 'Yes' : 'No'}
                            </span>
                          </div>
                          {participant.mtmp_required && (
                            <div className="col-span-2">
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                If Yes, provide details
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.mtmp_details || '-'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Section: Clinical Details */}
                    {sections.clinical && (
                      <div className="space-y-4 print:break-inside-avoid">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-900 pb-2.5">
                          {sectionNumbers.clinical}. Clinical Details
                        </h3>
                        <div className="grid grid-cols-2 gap-6 text-xs">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                              Primary Diagnosis
                            </span>
                            <p className="text-gray-700 leading-relaxed break-words mt-0.5">
                              {participant.primary_diagnosis || '-'}
                            </p>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                              Secondary Diagnosis
                            </span>
                            <p className="text-gray-700 leading-relaxed break-words mt-0.5">
                              {participant.secondary_diagnosis || '-'}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                              Allergies
                            </span>
                            <p className="text-red-700 font-semibold leading-relaxed break-words mt-0.5">
                              {participant.allergies || 'No known allergies'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section: Clinical Trackers */}
                    {sections.trackers && (
                      <div className="space-y-4 print:break-inside-avoid">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-900 pb-2.5">
                          {sectionNumbers.trackers}. Clinical Trackers
                        </h3>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-2">
                            Trackers Enabled on Care Plan
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {participant.track_bowel ? (
                              <Badge className="bg-teal-50 text-teal-700 border border-teal-200 uppercase text-[9px] font-bold">
                                Bowel Tracking
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="opacity-40 uppercase text-[9px] font-normal"
                              >
                                Bowel Tracking
                              </Badge>
                            )}
                            {participant.track_seizure ? (
                              <Badge className="bg-teal-50 text-teal-700 border border-teal-200 uppercase text-[9px] font-bold">
                                Seizure Activity
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="opacity-40 uppercase text-[9px] font-normal"
                              >
                                Seizure Activity
                              </Badge>
                            )}
                            {participant.track_sleep ? (
                              <Badge className="bg-teal-50 text-teal-700 border border-teal-200 uppercase text-[9px] font-bold">
                                Sleep Tracking
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="opacity-40 uppercase text-[9px] font-normal"
                              >
                                Sleep Tracking
                              </Badge>
                            )}
                            {participant.track_behaviour ? (
                              <Badge className="bg-teal-50 text-teal-700 border border-teal-200 uppercase text-[9px] font-bold">
                                Behaviour Observation
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="opacity-40 uppercase text-[9px] font-normal"
                              >
                                Behaviour Observation
                              </Badge>
                            )}
                            {participant.track_community ? (
                              <Badge className="bg-teal-50 text-teal-700 border border-teal-200 uppercase text-[9px] font-bold">
                                Community Participation
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="opacity-40 uppercase text-[9px] font-normal"
                              >
                                Community Participation
                              </Badge>
                            )}
                            {participant.track_nutrition ? (
                              <Badge className="bg-teal-50 text-teal-700 border border-teal-200 uppercase text-[9px] font-bold">
                                Nutrition Tracker
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="opacity-40 uppercase text-[9px] font-normal"
                              >
                                Nutrition Tracker
                              </Badge>
                            )}
                            {participant.track_mtm ? (
                              <Badge className="bg-teal-50 text-teal-700 border border-teal-200 uppercase text-[9px] font-bold">
                                Mealtime Management
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="opacity-40 uppercase text-[9px] font-normal"
                              >
                                Mealtime Management
                              </Badge>
                            )}
                            {participant.track_hygiene ? (
                              <Badge className="bg-teal-50 text-teal-700 border border-teal-200 uppercase text-[9px] font-bold">
                                Hygiene Tracking
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="opacity-40 uppercase text-[9px] font-normal"
                              >
                                Hygiene Tracking
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section: Medical Routine */}
                    {sections.medicalRoutine && (
                      <div className="space-y-4 print:break-inside-avoid">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-900 pb-2.5">
                          {sectionNumbers.medicalRoutine}. Medical Routine
                        </h3>
                        <div className="grid grid-cols-3 gap-6 text-xs">
                          <div className="bg-gray-50/50 p-3.5 rounded-lg border border-gray-100">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider font-bold mb-1">
                              Pharmacy
                            </span>
                            <div className="space-y-1">
                              <div>
                                <span className="text-gray-400 text-[10px]">
                                  Pharmacy Name:
                                </span>{' '}
                                <span className="font-semibold text-gray-800">
                                  {participant.pharmacy_name || '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 text-[10px]">
                                  Pharmacy Contact:
                                </span>{' '}
                                <span className="font-semibold text-gray-800">
                                  {participant.pharmacy_contact || '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 text-[10px]">
                                  Pharmacy Location:
                                </span>{' '}
                                <span className="font-semibold text-gray-800">
                                  {participant.pharmacy_location || '-'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50/50 p-3.5 rounded-lg border border-gray-100">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider font-bold mb-1">
                              General Practitioner
                            </span>
                            <div className="space-y-1">
                              <div>
                                <span className="text-gray-400 text-[10px]">
                                  GP Name:
                                </span>{' '}
                                <span className="font-semibold text-gray-800">
                                  {participant.gp_name || '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 text-[10px]">
                                  GP Contact:
                                </span>{' '}
                                <span className="font-semibold text-gray-800">
                                  {participant.gp_contact || '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 text-[10px]">
                                  GP Location:
                                </span>{' '}
                                <span className="font-semibold text-gray-800">
                                  {participant.gp_location || '-'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50/50 p-3.5 rounded-lg border border-gray-100">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider font-bold mb-1">
                              Psychiatrist
                            </span>
                            <div className="space-y-1">
                              <div>
                                <span className="text-gray-400 text-[10px]">
                                  Psychiatrist Name:
                                </span>{' '}
                                <span className="font-semibold text-gray-800">
                                  {participant.psychiatrist_name || '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 text-[10px]">
                                  Psychiatrist Contact:
                                </span>{' '}
                                <span className="font-semibold text-gray-800">
                                  {participant.psychiatrist_contact || '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 text-[10px]">
                                  Psychiatrist Location:
                                </span>{' '}
                                <span className="font-semibold text-gray-800">
                                  {participant.psychiatrist_location || '-'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {participant.medical_routine_other && (
                            <div className="col-span-3">
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Any Other
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.medical_routine_other}
                              </p>
                            </div>
                          )}

                          {participant.medical_routine_general_process && (
                            <div className="col-span-3">
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                General Process
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.medical_routine_general_process}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Section: Medications */}
                    {sections.medications && (
                      <div className="space-y-4 print:break-before-page">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-900 pb-2.5">
                          {sectionNumbers.medications}. Medications
                        </h3>

                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600 uppercase tracking-wider font-sans">
                                <th className="px-4 py-3">Medication</th>
                                <th className="px-4 py-3">Brand Name</th>
                                <th className="px-4 py-3">
                                  Dosage / Instructions
                                </th>
                                <th className="px-4 py-3 w-32">Type</th>
                                <th className="px-4 py-3 w-24 text-center">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {medications.map((med) => (
                                <tr key={med.id} className="align-middle">
                                  <td className="px-4 py-3 font-semibold text-gray-900">
                                    {med.medication?.medication_name}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">
                                    {med.medication?.brand_name || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-gray-700">
                                    {med.dosage || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-gray-500 capitalize">
                                    {med.medication?.medication_type
                                      ?.medication_type_name || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span
                                      className={cn(
                                        'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border',
                                        med.is_active
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-gray-100 text-gray-400 border-gray-200',
                                      )}
                                    >
                                      {med.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {medications.length === 0 && (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="px-4 py-10 text-center text-gray-400 italic"
                                  >
                                    No registered medications recorded.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Section: Emergency Management */}
                    {sections.emergency && (
                      <div className="space-y-4 print:break-inside-avoid">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-900 pb-2.5">
                          {sectionNumbers.emergency}. Emergency Management
                        </h3>
                        <div className="grid grid-cols-1 gap-4 text-xs">
                          {participant.mental_health_plan && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Mental Health Plan
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.mental_health_plan}
                              </p>
                            </div>
                          )}
                          {participant.medical_plan && (
                            <div>
                              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                Medical Plan
                              </span>
                              <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                                {participant.medical_plan}
                              </p>
                            </div>
                          )}
                          <div>
                            <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                              Natural Disaster / Relocation Plan
                            </span>
                            <p className="text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                              {participant.natural_disaster_plan ||
                                'No specific natural disaster plans listed.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section: Contacts */}
                    {sections.contacts && (
                      <div className="space-y-4 print:break-inside-avoid">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-900 pb-2.5">
                          {sectionNumbers.contacts}. Contacts
                        </h3>

                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600 uppercase tracking-wider font-sans">
                                <th className="px-4 py-3">Contact Name</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Phone</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Address</th>
                                <th className="px-4 py-3">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {contacts.map((contact) => (
                                <tr key={contact.id}>
                                  <td className="px-4 py-3 font-semibold text-gray-900">
                                    {contact.contact_name}
                                  </td>
                                  <td className="px-4 py-3 text-gray-500 capitalize">
                                    {contact.contact_type?.contact_type_name ||
                                      'Contact'}
                                  </td>
                                  <td className="px-4 py-3 text-gray-700 font-mono">
                                    {contact.phone || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">
                                    {contact.email || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">
                                    {contact.address || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-gray-500 italic max-w-xs break-words">
                                    {contact.notes || '-'}
                                  </td>
                                </tr>
                              ))}
                              {contacts.length === 0 && (
                                <tr>
                                  <td
                                    colSpan={6}
                                    className="px-4 py-10 text-center text-gray-400 italic"
                                  >
                                    No contacts listed.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Section: Documents */}
                    {sections.documents && (
                      <div className="space-y-4 print:break-before-page">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-900 pb-2.5">
                          {sectionNumbers.documents}. Documents
                        </h3>

                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600 uppercase tracking-wider font-sans">
                                <th className="px-4 py-3">Document Name</th>
                                <th className="px-4 py-3 w-28 text-right">
                                  Size
                                </th>
                                <th className="px-4 py-3 w-36">Uploaded On</th>
                                <th className="px-4 py-3 w-32">Uploaded By</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {documents.map((doc) => (
                                <tr key={doc.id}>
                                  <td className="px-4 py-3 font-semibold text-gray-900 break-all">
                                    {doc.file_name}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-gray-500">
                                    {formatByteSize(doc.file_size)}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600 font-mono">
                                    {doc.created_at
                                      ? format(
                                          new Date(doc.created_at),
                                          'dd MMM yyyy HH:mm',
                                        )
                                      : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-gray-500 leading-tight">
                                    {(doc as any).uploader_info?.staff_name ||
                                      'System'}
                                  </td>
                                </tr>
                              ))}
                              {documents.length === 0 && (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="px-4 py-10 text-center text-gray-400 italic"
                                  >
                                    No uploaded documents.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Section: Shift Notes */}
                    {sections.shiftNotes && (
                      <div className="space-y-4 print:break-before-page">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-900 pb-2.5">
                          {sectionNumbers.shiftNotes}. Shift Notes
                        </h3>

                        <div className="space-y-5">
                          {shiftNotes.slice(0, 10).map((note) => (
                            <div
                              key={note.id}
                              className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 text-xs space-y-2"
                            >
                              <div className="flex justify-between items-center gap-2 border-b border-gray-200/50 pb-2 mb-2">
                                <span className="font-bold text-gray-900">
                                  Shift:{' '}
                                  {format(
                                    new Date(note.start_date),
                                    'dd MMM yyyy',
                                  )}{' '}
                                  ({note.shift_type || 'Day'})
                                </span>
                                <span className="text-gray-400 font-medium">
                                  Staff:{' '}
                                  <span className="font-semibold text-blue-700">
                                    {note.staff?.staff_name}
                                  </span>
                                </span>
                              </div>
                              {note.shift_summary && (
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                    Summary Presentation
                                  </span>
                                  <p className="text-gray-800 leading-relaxed font-medium mt-0.5">
                                    "{note.shift_summary}"
                                  </p>
                                </div>
                              )}
                              {note.full_note && (
                                <div className="pt-2 border-t border-gray-100">
                                  <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">
                                    Detailed Care Notes
                                  </span>
                                  <p className="text-gray-700 leading-relaxed italic mt-0.5 whitespace-pre-wrap">
                                    "{note.full_note}"
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                          {shiftNotes.length === 0 && (
                            <div className="border border-gray-100 p-8 rounded-xl bg-gray-50/50 text-center text-gray-400 italic text-xs">
                              No recent shift documentation logs.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Section: Activity Log */}
                    {sections.activityLog && (
                      <div className="space-y-4 print:break-before-page">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-900 pb-2.5">
                          {sectionNumbers.activityLog}. Activity Log
                        </h3>

                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600 uppercase tracking-wider font-sans">
                                <th className="px-4 py-2.5 w-36">Date</th>
                                <th className="px-4 py-2.5 w-28">Activity</th>
                                <th className="px-4 py-2.5">Details</th>
                                <th className="px-4 py-2.5 w-32">User</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-mono text-[10px]">
                              {activities.map((act) => (
                                <tr key={act.id}>
                                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                                    {act.created_at
                                      ? format(
                                          new Date(act.created_at),
                                          'dd MMM yyyy HH:mm',
                                        )
                                      : '-'}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className="font-bold uppercase tracking-tighter text-indigo-700">
                                      {act.activity_type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-gray-700 font-sans">
                                    {act.description}
                                  </td>
                                  <td className="px-4 py-2.5 text-gray-600 font-sans leading-none">
                                    {act.user_name || 'System'}
                                  </td>
                                </tr>
                              ))}
                              {activities.length === 0 && (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="px-4 py-8 text-center text-gray-400 italic font-sans text-xs"
                                  >
                                    No audit history logs recorded.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </PrintableReport>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[500px] bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                  <UsersIcon className="size-16 text-gray-300 animate-pulse mb-4" />
                  <h3 className="text-lg font-bold text-gray-800 font-sans">
                    No Participant Selected
                  </h3>
                  <p className="text-sm text-gray-500 font-sans text-center max-w-sm mt-1">
                    Select a participant from the criteria sidebar to compile
                    and preview their clinical report.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
