import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EmergencyManagementProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export function EmergencyManagement({
  canEdit,
  formData,
  onFormChange,
}: EmergencyManagementProps) {
  return (
    <Card className="pb-2.5" id="emergency-management">
      <CardHeader>
        <CardTitle>Emergency Management Plan</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-2.5">
        {/* Mental Health Plan */}
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="w-full max-w-56">Mental Health Plan</Label>
            <Textarea
              id="mental_health_plan"
              value={formData.mental_health_plan || ''}
              onChange={(e) => onFormChange('mental_health_plan', e.target.value)}
              rows={5}
              placeholder="Describe mental health management plan..."
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Medical Plan */}
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="w-full max-w-56">Medical Plan</Label>
            <Textarea
              id="medical_plan"
              value={formData.medical_plan || ''}
              onChange={(e) => onFormChange('medical_plan', e.target.value)}
              rows={5}
              placeholder="Describe medical emergency plan..."
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Natural Disaster / Relocation Plan */}
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="w-full max-w-56">Natural Disaster / Relocation Plan</Label>
            <Textarea
              id="natural_disaster_plan"
              value={formData.natural_disaster_plan || ''}
              onChange={(e) => onFormChange('natural_disaster_plan', e.target.value)}
              rows={5}
              placeholder="Describe natural disaster and relocation procedures..."
              disabled={!canEdit}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
