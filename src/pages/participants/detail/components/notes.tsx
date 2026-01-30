import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface NotesProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: string) => void;
  onSave: () => void;
}

export function Notes({
  canEdit,
  formData,
  onFormChange,
  onSave,
}: NotesProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
  };

  return (
    <Card className="pb-2.5" id="notes">
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">General Notes</Label>
            <Textarea
              id="general_notes"
              value={formData.general_notes}
              onChange={(e) => onFormChange('general_notes', e.target.value)}
              rows={8}
              placeholder="Add any general notes or observations..."
              disabled={!canEdit}
            />
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
