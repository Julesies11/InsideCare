import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ShiftNoteSupportsSectionProps {
  canEdit: boolean;
  formData: Record<string, unknown>;
  onFormChange: (field: string, value: unknown) => void;
}

export function ShiftNoteSupportsSection({
  canEdit,
  formData,
  onFormChange,
}: ShiftNoteSupportsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supports Delivered</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="adl_supports">ADLs (Personal Care)</Label>
          <p className="text-xs text-muted-foreground">
            What personal care supports were provided? Include areas such as
            hygiene, dressing. Describe level of support (independent, prompted,
            assisted) and any refusals or challenges.
          </p>
          <Textarea
            id="adl_supports"
            value={formData.adl_supports || ''}
            onChange={(e) => onFormChange('adl_supports', e.target.value)}
            placeholder="Describe ADL supports..."
            rows={4}
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="domestic_tasks">Domestic Tasks</Label>
          <p className="text-xs text-muted-foreground">
            What household tasks were completed or supported? Include how the
            participant engaged (e.g. completed independently, needed prompting,
            declined).
          </p>
          <Textarea
            id="domestic_tasks"
            value={formData.domestic_tasks || ''}
            onChange={(e) => onFormChange('domestic_tasks', e.target.value)}
            placeholder="Describe domestic tasks..."
            rows={4}
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity_building_goals">
            Capacity Building / Goals
          </Label>
          <p className="text-xs text-muted-foreground">
            What skill-building or goal-related supports were provided? Describe
            the activity and how the participant responded.
          </p>
          <Textarea
            id="capacity_building_goals"
            value={formData.capacity_building_goals || ''}
            onChange={(e) =>
              onFormChange('capacity_building_goals', e.target.value)
            }
            placeholder="Describe goal-related supports..."
            rows={4}
            disabled={!canEdit}
          />
        </div>
      </CardContent>
    </Card>
  );
}
