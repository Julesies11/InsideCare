import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useParticipants } from '@/hooks/use-participants';
import { useStaff } from '@/hooks/use-staff';
import { useHouses } from '@/hooks/use-houses';
import { format, parseISO } from 'date-fns';

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

  const selectedStaff = staff.find(s => s.id === formData.staff_id);
  const selectedHouse = houses.find(h => h.id === formData.house_id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shift Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.shift_id && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50 mb-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Date</span>
                <p className="text-sm font-medium">{formData.start_date ? format(parseISO(formData.start_date as string), 'PPP') : 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Time</span>
                <p className="text-sm font-medium">
                  {formData.shift_time ? (formData.shift_time as string).substring(0, 5) : 'N/A'}
                  {(formData.end_time || (formData as any).shift?.end_time) && 
                    ` - ${(formData.end_time as string || (formData as any).shift?.end_time as string || '').substring(0, 5)}`}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Staff</span>
                <p className="text-sm font-medium">{selectedStaff?.staff_name || 'Unassigned'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">House</span>
                <p className="text-sm font-medium">{selectedHouse?.house_name || 'N/A'}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="participant_id">Participant *</Label>
              <Select
                value={(formData.participant_id as string) || 'none'}
                onValueChange={(val) => onFormChange('participant_id', val === 'none' ? null : val)}
                disabled={!canEdit || isParticipantLocked}
              >
                <SelectTrigger id="participant_id">
                  <SelectValue placeholder="Select participant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select participant...</SelectItem>
                  {participants.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.participant_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isParticipantLocked && (
                <p className="text-xs text-muted-foreground">
                  This note is locked to the selected participant.
                </p>
              )}
            </div>
            
            <div className="hidden md:block" /> 
          </div>

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
