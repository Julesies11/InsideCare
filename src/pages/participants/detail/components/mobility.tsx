import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface MobilityProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export function Mobility({
  canEdit,
  formData,
  onFormChange,
}: MobilityProps) {
  return (
    <Card className="pb-2.5" id="mobility">
      <CardHeader>
        <CardTitle>Mobility</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Mobility Support Required</Label>
            <Textarea
              id="mobility_support"
              value={formData.mobility_support || ''}
              onChange={(e) => onFormChange('mobility_support', e.target.value)}
              rows={5}
              placeholder="Describe mobility support needs..."
              disabled={!canEdit}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
