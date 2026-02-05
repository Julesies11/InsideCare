import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ClinicalDetailsProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: string) => void;
  onSave: () => void;
}

export function ClinicalDetails({
  canEdit,
  formData,
  onFormChange,
  onSave,
}: ClinicalDetailsProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
  };

  return (
    <Card className="pb-2.5" id="clinical">
      <CardHeader>
        <CardTitle>Clinical Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2.5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Primary Diagnosis</Label>
            <Textarea
              id="primary_diagnosis"
              value={formData.primary_diagnosis}
              onChange={(e) => onFormChange('primary_diagnosis', e.target.value)}
              rows={5}
              placeholder="Primary Diagnosis..."
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Secondary Diagnosis</Label>
            <Textarea
              id="secondary_diagnosis"
              value={formData.secondary_diagnosis}
              onChange={(e) => onFormChange('secondary_diagnosis', e.target.value)}
              rows={5}
              placeholder="Secondary Diagnosis..."
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Allergies</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => onFormChange('allergies', e.target.value)}
              rows={5}
              placeholder="List any allergies..."
              disabled={!canEdit}
            />
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
