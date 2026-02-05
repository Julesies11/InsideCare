import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CommunicationProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export function Communication({
  canEdit,
  formData,
  onFormChange,
}: CommunicationProps) {
  return (
    <Card className="pb-2.5" id="communication">
      <CardHeader>
        <CardTitle>Communication</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Preferred Communication Type</Label>
            <Select
              value={formData.communication_type || 'verbal'}
              onValueChange={(value) => onFormChange('communication_type', value)}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select communication type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verbal">Verbal</SelectItem>
                <SelectItem value="non_verbal">Non-verbal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Communication Type Notes</Label>
            <Textarea
              id="communication_notes"
              value={formData.communication_notes || ''}
              onChange={(e) => onFormChange('communication_notes', e.target.value)}
              rows={4}
              placeholder="Describe communication type preferences..."
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Communication & Language Needs</Label>
            <Textarea
              id="communication_language_needs"
              value={formData.communication_language_needs || ''}
              onChange={(e) => onFormChange('communication_language_needs', e.target.value)}
              rows={4}
              placeholder="Describe how to communicate (e.g., firm tone, constant validation, etc.)..."
              disabled={!canEdit}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
