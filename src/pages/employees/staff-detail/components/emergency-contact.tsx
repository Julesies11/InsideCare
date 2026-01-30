import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EmergencyContactProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
  canEdit: boolean;
}

export function EmergencyContact({
  formData,
  onFormChange,
  canEdit,
}: EmergencyContactProps) {
  return (
    <Card className="pb-2.5" id="emergency_contact">
      <CardHeader>
        <CardTitle>Emergency Contact</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Contact Name</Label>
            <Input
              id="emergency_contact_name"
              placeholder="Emergency contact name"
              value={formData.emergency_contact_name || ''}
              onChange={(e) => onFormChange('emergency_contact_name', e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Contact Phone</Label>
            <Input
              id="emergency_contact_phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.emergency_contact_phone || ''}
              onChange={(e) => onFormChange('emergency_contact_phone', e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
