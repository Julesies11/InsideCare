import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface MedicalAllergiesProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: string) => void;
  onSave: () => void;
}

export function MedicalAllergies({
  canEdit,
  formData,
  onFormChange,
  onSave,
}: MedicalAllergiesProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
  };

  return (
    <Card className="pb-2.5" id="medical">
      <CardHeader>
        <CardTitle>Medical & Allergies</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Medical Conditions</Label>
            <Textarea
              id="medical_conditions"
              value={formData.medical_conditions}
              onChange={(e) => onFormChange('medical_conditions', e.target.value)}
              rows={5}
              placeholder="List any medical conditions..."
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
