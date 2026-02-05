import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface MealPreparationProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export function MealPreparation({
  canEdit,
  formData,
  onFormChange,
}: MealPreparationProps) {
  return (
    <Card className="pb-2.5" id="meal-prep">
      <CardHeader>
        <CardTitle>Meal Preparation and Kitchen Safety</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Meal Preparation Support Needs</Label>
            <Textarea
              id="meal_prep_support"
              value={formData.meal_prep_support || ''}
              onChange={(e) => onFormChange('meal_prep_support', e.target.value)}
              rows={5}
              placeholder="Describe meal preparation and kitchen safety support needs..."
              disabled={!canEdit}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
