import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CulturalReligiousProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export function CulturalReligious({
  canEdit,
  formData,
  onFormChange,
}: CulturalReligiousProps) {
  return (
    <Card className="pb-2.5" id="cultural-religious">
      <CardHeader>
        <CardTitle>Cultural and Religious</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Cultural and Religious Support Needs</Label>
            <Textarea
              id="cultural_religious_support"
              value={formData.cultural_religious_support || ''}
              onChange={(e) => onFormChange('cultural_religious_support', e.target.value)}
              rows={5}
              placeholder="Describe cultural and religious support needs..."
              disabled={!canEdit}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
