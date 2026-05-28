import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ShiftNoteSummarySectionProps {
  canEdit: boolean;
  formData: Record<string, unknown>;
  onFormChange: (field: string, value: unknown) => void;
}

export function ShiftNoteSummarySection({
  canEdit,
  formData,
  onFormChange,
}: ShiftNoteSummarySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="shift_summary">Final Summary</Label>
          <p className="text-xs text-muted-foreground">
            Provide a concise summary of the overall shift outcomes and any key messages for the next staff member.
          </p>
          <Textarea
            id="shift_summary"
            value={formData.shift_summary || ''}
            onChange={(e) => onFormChange('shift_summary', e.target.value)}
            placeholder="Enter final shift summary..."
            rows={5}
            disabled={!canEdit}
          />
        </div>
      </CardContent>
    </Card>
  );
}
