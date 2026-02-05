import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface HouseholdTasksProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export function HouseholdTasks({
  canEdit,
  formData,
  onFormChange,
}: HouseholdTasksProps) {
  return (
    <Card className="pb-2.5" id="household">
      <CardHeader>
        <CardTitle>Household Tasks</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Household Support Needs</Label>
            <Textarea
              id="household_support"
              value={formData.household_support || ''}
              onChange={(e) => onFormChange('household_support', e.target.value)}
              rows={5}
              placeholder="Describe household tasks support needs..."
              disabled={!canEdit}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
