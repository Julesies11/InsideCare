import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface MealtimeManagementProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
  validationErrors?: Record<string, string>;
}

export function MealtimeManagement({
  canEdit,
  formData,
  onFormChange,
  validationErrors = {},
}: MealtimeManagementProps) {
  return (
    <Card className="pb-2.5" id="mealtime">
      <CardHeader>
        <CardTitle>Mealtime Management Plan</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-2.5">

        {/* MTMP Required */}
        <div className="flex items-center flex-wrap lg:flex-nowrap gap-2.5">
          <Label className="w-full max-w-56">
            Is there a MTMP?
          </Label>
          <Checkbox
            checked={formData.mtmp_required || false}
            disabled={!canEdit}
            onCheckedChange={(val) =>
              onFormChange('mtmp_required', val === true)
            }
          />
        </div>

        {/* MTMP Details */}
        <div className="flex items-start flex-wrap lg:flex-nowrap gap-2.5">
          <Label className={cn("w-full max-w-56", formData.mtmp_required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
            If Yes, provide details
          </Label>
          <div className="flex-1 w-full">
            <Textarea
              id="mtmp_details"
              value={formData.mtmp_details || ''}
              onChange={(e) => onFormChange('mtmp_details', e.target.value)}
              rows={4}
              placeholder="Describe the Mealtime Management Plan..."
              disabled={!canEdit || !formData.mtmp_required}
              className={cn(validationErrors.mtmp_details && "border-destructive focus-visible:ring-destructive")}
            />
            {validationErrors.mtmp_details && (
              <p className="text-sm text-destructive mt-1.5">
                {validationErrors.mtmp_details}
              </p>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
