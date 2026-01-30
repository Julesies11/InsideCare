import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface HygieneRoutinesProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: string) => void;
  onSave: () => void;
}

export function HygieneRoutines({
  canEdit,
  formData,
  onFormChange,
  onSave,
}: HygieneRoutinesProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
  };

  return (
    <Card className="pb-2.5" id="hygiene">
      <CardHeader>
        <CardTitle>Hygiene & Routines</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Morning Routine</Label>
            <Textarea
              id="morning_routine"
              value={formData.morning_routine}
              onChange={(e) => onFormChange('morning_routine', e.target.value)}
              rows={5}
              placeholder="Describe the morning routine..."
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Shower Support</Label>
            <Textarea
              id="shower_support"
              value={formData.shower_support}
              onChange={(e) => onFormChange('shower_support', e.target.value)}
              rows={5}
              placeholder="Describe shower support needs..."
              disabled={!canEdit}
            />
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
