import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useParticipants } from '@/hooks/use-participants';
import { useStaff } from '@/hooks/use-staff';
import { useHouses } from '@/hooks/use-houses';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { ROUTES } from '@/config/routes.config';

const getInitials = (name?: string) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

interface ShiftNoteOverviewSectionProps {
  canEdit: boolean;
  formData: Record<string, unknown>;
  onFormChange: (field: string, value: unknown) => void;
  onBulkChange?: (changes: Record<string, unknown>) => void;
  isShiftLocked?: boolean;
  isParticipantLocked?: boolean;
}

export function ShiftNoteOverviewSection({
  canEdit,
  formData,
  onFormChange,
  onBulkChange,
  isShiftLocked = false,
  isParticipantLocked = false,
}: ShiftNoteOverviewSectionProps) {
  const { staff } = useStaff();
  const { houses } = useHouses(0, 1000);

  // Filter participants to only show active ones from the selected house (if any)
  const { participants } = useParticipants(0, 1000, [], {
    houses: formData.house_id ? [formData.house_id as string] : [],
    statuses: ['active'],
  });

  const selectedStaff = useMemo(() => {
    const sId = formData.staff_id;
    if (sId) {
      return staff.find(s => s.id === sId) || (formData.staff as any);
    }
    return (formData.staff as any) || null;
  }, [formData.staff_id, formData.staff, staff]);

  const selectedParticipant = useMemo(() => {
    if (formData.participant) {
      return formData.participant as any;
    }
    const pId = formData.participant_id;
    if (pId) {
      return participants.find((p: any) => p.id === pId) || null;
    }
    return null;
  }, [formData.participant, formData.participant_id, participants]);

  const selectedHouse = houses.find(h => h.id === formData.house_id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shift Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.shift_id && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50 mb-4 min-w-0">
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Date</span>
                <p className="text-sm font-medium pt-1 break-words whitespace-normal">{formData.start_date ? format(parseISO(formData.start_date as string), 'PPP') : 'N/A'}</p>
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Time</span>
                <p className="text-sm font-medium pt-1 break-words whitespace-normal">
                  {formData.shift_time ? (formData.shift_time as string).substring(0, 5) : 'N/A'}
                  {(formData.end_time || (formData as any).shift?.end_time) && 
                    ` - ${(formData.end_time as string || (formData as any).shift?.end_time as string || '').substring(0, 5)}`}
                </p>
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Staff</span>
                {selectedStaff ? (
                  <Link 
                    to={`${ROUTES.STAFF_DETAIL}/${selectedStaff.id}`}
                    className="flex items-center gap-2 group/staff w-full min-w-0 pt-0.5"
                  >
                    <SecureAvatar 
                      src={selectedStaff.photo_url} 
                      initials={getInitials(selectedStaff.staff_name || selectedStaff.name)} 
                      className="size-6 transition-all group-hover/staff:ring-2 group-hover/staff:ring-primary/20 shrink-0"
                      bucket={STORAGE_BUCKETS.STAFF_PHOTOS} 
                    />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover/staff:underline transition-colors break-words whitespace-normal">
                      {selectedStaff.staff_name || selectedStaff.name}
                    </span>
                  </Link>
                ) : (
                  <p className="text-sm font-medium pt-1 break-words whitespace-normal">Unassigned</p>
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Participant</span>
                {selectedParticipant ? (
                  <Link 
                    to={`${ROUTES.PARTICIPANT_DETAIL}/${selectedParticipant.id}`}
                    className="flex items-center gap-2 group/participant w-full min-w-0 pt-0.5"
                  >
                    <SecureAvatar 
                      src={selectedParticipant.photo_url} 
                      initials={getInitials(selectedParticipant.participant_name || selectedParticipant.name)} 
                      className="size-6 transition-all group-hover/participant:ring-2 group-hover/participant:ring-primary/20 shrink-0"
                      bucket={STORAGE_BUCKETS.PARTICIPANT_PHOTOS} 
                    />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover/participant:underline transition-colors break-words whitespace-normal">
                      {selectedParticipant.participant_name || selectedParticipant.name}
                    </span>
                  </Link>
                ) : (
                  <p className="text-sm font-medium pt-1 break-words whitespace-normal">General House Note</p>
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">House</span>
                <p className="text-sm font-medium pt-1 break-words whitespace-normal">{selectedHouse?.house_name || 'N/A'}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="risks_observed">Risks observed during shift?</Label>
                <RadioGroup
                  value={formData.risks_observed === true ? 'yes' : formData.risks_observed === false ? 'no' : ''}
                  onValueChange={(val) => onFormChange('risks_observed', val === 'yes' ? true : val === 'no' ? false : null)}
                  disabled={!canEdit}
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="risks_yes" />
                    <Label htmlFor="risks_yes" className="font-normal cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="risks_no" />
                    <Label htmlFor="risks_no" className="font-normal cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {formData.risks_observed && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                  <Label htmlFor="risk_description" className="text-xs text-muted-foreground">
                    Describe any risks or concerns observed this shift. Include what happened, what may have caused it, and what actions were taken.
                  </Label>
                  <Textarea
                    id="risk_description"
                    value={(formData.risk_description as string) || ''}
                    onChange={(e) => onFormChange('risk_description', e.target.value)}
                    placeholder="Enter risk description..."
                    rows={3}
                    disabled={!canEdit}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="overall_presentation">Overall Presentation</Label>
              <p className="text-xs text-muted-foreground">
                Describe how the participant presented across the shift (e.g. mood, engagement, behaviour, energy levels). Avoid vague terms like ‘good’ or ‘fine’.
              </p>
              <Textarea
                id="overall_presentation"
                value={(formData.overall_presentation as string) || ''}
                onChange={(e) => onFormChange('overall_presentation', e.target.value)}
                placeholder="Describe presentation..."
                rows={4}
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
