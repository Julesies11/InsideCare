import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface OtherSupportProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export function OtherSupport({
  canEdit,
  formData,
  onFormChange,
}: OtherSupportProps) {
  return (
    <Card className="pb-2.5" id="other-support">
      <CardHeader>
        <CardTitle>Other</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Any Other Support Needs</Label>
            <Textarea
              id="other_support"
              value={formData.other_support || ''}
              onChange={(e) => onFormChange('other_support', e.target.value)}
              rows={5}
              placeholder="Describe any other support needs..."
              disabled={!canEdit}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
