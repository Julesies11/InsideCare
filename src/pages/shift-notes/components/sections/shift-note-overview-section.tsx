import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useParticipants } from '@/hooks/use-participants';
import { useStaff } from '@/hooks/use-staff';
import { useHouses } from '@/hooks/use-houses';

interface ShiftNoteOverviewSectionProps {
  canEdit: boolean;
  formData: Record<string, unknown>;
  onFormChange: (field: string, value: unknown) => void;
}

export function ShiftNoteOverviewSection({
  canEdit,
  formData,
  onFormChange,
}: ShiftNoteOverviewSectionProps) {
  const { participants } = useParticipants(0, 100);
  const { staff } = useStaff();
  const { houses } = useHouses();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shift Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Shift Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => onFormChange('start_date', e.target.value)}
                required
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift_time">Shift Time</Label>
              <Input
                id="shift_time"
                type="time"
                value={formData.shift_time || ''}
                onChange={(e) => onFormChange('shift_time', e.target.value)}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift_type">Shift Type</Label>
              <Select
                value={formData.shift_type || 'none'}
                onValueChange={(val) => onFormChange('shift_type', val === 'none' ? null : val)}
                disabled={!canEdit}
              >
                <SelectTrigger id="shift_type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select type...</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="sleepover">Sleepover</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="house_id">House</Label>
              <Select
                value={formData.house_id || 'none'}
                onValueChange={(val) => onFormChange('house_id', val === 'none' ? null : val)}
                disabled={!canEdit}
              >
                <SelectTrigger id="house_id">
                  <SelectValue placeholder="Select house" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select house...</SelectItem>
                  {houses.map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.house_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="participant_id">Participant *</Label>
              <Select
                value={formData.participant_id || 'none'}
                onValueChange={(val) => onFormChange('participant_id', val === 'none' ? null : val)}
                disabled={!canEdit}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff_id">Staff Member *</Label>
              <Select
                value={formData.staff_id || 'none'}
                onValueChange={(val) => onFormChange('staff_id', val === 'none' ? null : val)}
                disabled={!canEdit}
              >
                <SelectTrigger id="staff_id">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select staff...</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.staff_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="risks_observed">Risks observed during shift?</Label>
                <Select
                  value={formData.risks_observed === true ? 'yes' : formData.risks_observed === false ? 'no' : 'none'}
                  onValueChange={(val) => onFormChange('risks_observed', val === 'yes' ? true : val === 'no' ? false : null)}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">N/A</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.risks_observed && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                  <Label htmlFor="risk_description" className="text-xs text-muted-foreground">
                    Describe any risks or concerns observed this shift. Include what happened, what may have caused it, and what actions were taken.
                  </Label>
                  <Textarea
                    id="risk_description"
                    value={formData.risk_description || ''}
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
                value={formData.overall_presentation || ''}
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
