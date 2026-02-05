import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface MealtimeManagementProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export function MealtimeManagement({
  canEdit,
  formData,
  onFormChange,
}: MealtimeManagementProps) {
  return (
    <Card className="pb-2.5" id="mealtime">
      <CardHeader>
        <CardTitle>Mealtime Management Plan</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-5">

        {/* MTMP Required */}
        <div className="flex items-center flex-wrap lg:flex-nowrap gap-2.5">
          <Label className="w-full max-w-56">
            Is there a MTMP?
          </Label>
          <Checkbox
            checked={formData.mtmp_required || false}
            disabled={!canEdit}
            onCheckedChange={(val) =>
              onFormChange('mtmp_required', val === true)
            }
          />
        </div>

        {/* MTMP Details */}
        <div className="flex items-start flex-wrap lg:flex-nowrap gap-2.5">
          <Label className="w-full max-w-56">
            If Yes, provide details
          </Label>
          <Textarea
            id="mtmp_details"
            value={formData.mtmp_details || ''}
            onChange={(e) => onFormChange('mtmp_details', e.target.value)}
            rows={4}
            placeholder="Describe the Mealtime Management Plan..."
            disabled={!canEdit || !formData.mtmp_required}
          />
        </div>

      </CardContent>
    </Card>
  );
}
