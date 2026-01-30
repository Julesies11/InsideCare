import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface RestrictivePracticesProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: string) => void;
  onSave: () => void;
}

export function RestrictivePractices({
  canEdit,
  formData,
  onFormChange,
  onSave,
}: RestrictivePracticesProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
  };

  return (
    <Card className="pb-2.5" id="practices">
      <CardHeader>
        <CardTitle>Restrictive Practices</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Restrictive Practices</Label>
            <Textarea
              id="restrictive_practices"
              value={formData.restrictive_practices}
              onChange={(e) => onFormChange('restrictive_practices', e.target.value)}
              rows={5}
              placeholder="Document any restrictive practices..."
              disabled={!canEdit}
            />
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
