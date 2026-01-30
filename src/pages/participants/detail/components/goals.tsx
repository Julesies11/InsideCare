import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface GoalsProps {
  participant?: Participant;
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: string) => void;
  onSave: () => void;
}

export function Goals({
  participant,
  canEdit,
  formData,
  onFormChange,
  onSave,
}: GoalsProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
  };

  return (
    <Card className="pb-2.5" id="goals">
      <CardHeader>
        <CardTitle>Goals</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Current Goals</Label>
            <Textarea
              id="current_goals"
              value={formData.current_goals}
              onChange={(e) => onFormChange('current_goals', e.target.value)}
              rows={8}
              placeholder="List current goals and objectives..."
              disabled={!canEdit}
            />
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
