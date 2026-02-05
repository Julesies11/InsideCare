import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface HealthWellbeingProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export function HealthWellbeing({
  canEdit,
  formData,
  onFormChange,
}: HealthWellbeingProps) {
  return (
    <Card className="pb-2.5" id="health-wellbeing">
      <CardHeader>
        <CardTitle>Health and Wellbeing</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Health & Wellbeing Support Needs</Label>
            <Textarea
              id="health_wellbeing_support"
              value={formData.health_wellbeing_support || ''}
              onChange={(e) => onFormChange('health_wellbeing_support', e.target.value)}
              rows={5}
              placeholder="Describe health and wellbeing support needs..."
              disabled={!canEdit}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
