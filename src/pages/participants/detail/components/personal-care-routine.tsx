import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PersonalCareRoutineProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export function PersonalCareRoutine({
  canEdit,
  formData,
  onFormChange,
}: PersonalCareRoutineProps) {
  return (
    <Card className="pb-2.5" id="personal-care">
      <CardHeader>
        <CardTitle>Personal Care and Routine</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Routine</Label>
            <Textarea
              id="routine"
              value={formData.routine || ''}
              onChange={(e) => onFormChange('routine', e.target.value)}
              rows={5}
              placeholder="Describe the daily routine..."
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Hygiene Support Required</Label>
            <Textarea
              id="hygiene_support"
              value={formData.hygiene_support || ''}
              onChange={(e) => onFormChange('hygiene_support', e.target.value)}
              rows={5}
              placeholder="Describe hygiene support needs..."
              disabled={!canEdit}
            />
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
