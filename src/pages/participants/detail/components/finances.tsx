import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface FinancesProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export function Finances({
  canEdit,
  formData,
  onFormChange,
}: FinancesProps) {
  return (
    <Card className="pb-2.5" id="finances">
      <CardHeader>
        <CardTitle>Finances</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Finance Support Needs</Label>
            <Textarea
              id="finance_support"
              value={formData.finance_support || ''}
              onChange={(e) => onFormChange('finance_support', e.target.value)}
              rows={5}
              placeholder="Describe financial management support needs..."
              disabled={!canEdit}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
