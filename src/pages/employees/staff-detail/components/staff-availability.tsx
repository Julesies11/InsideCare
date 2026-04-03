import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface StaffAvailabilityProps {
  formData: Record<string, any>;
  onFormChange: (field: string, value: any) => void;
  canEdit: boolean;
}

export function StaffAvailability({
  formData,
  onFormChange,
  canEdit,
}: StaffAvailabilityProps) {
  return (
    <Card className="pb-2.5" id="staff_availability">
      <CardHeader>
        <CardTitle>Availability</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2.5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label htmlFor="availability" className="flex w-full max-w-56">Availability Schedule</Label>
            <Textarea
              id="availability"
              placeholder="Staff availability schedule (e.g., Monday 9am-5pm, etc.)"
              value={formData.availability || ''}
              onChange={(e) => onFormChange('availability', e.target.value)}
              disabled={!canEdit}
              rows={5}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
