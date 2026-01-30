import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AdditionalInfoProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
  canEdit: boolean;
}

export function AdditionalInfo({
  formData,
  onFormChange,
  canEdit,
}: AdditionalInfoProps) {
  return (
    <Card className="pb-2.5" id="additional_info">
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about staff member"
              value={formData.notes || ''}
              onChange={(e) => onFormChange('notes', e.target.value)}
              disabled={!canEdit}
              rows={4}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
