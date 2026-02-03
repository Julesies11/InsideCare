import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface BehaviourSupportProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
  onSave: () => void;
}

export function BehaviourSupport({
  canEdit,
  formData,
  onFormChange,
  onSave,
}: BehaviourSupportProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
  };

  return (
    <Card className="pb-2.5" id="behaviour">
      <CardHeader>
        <CardTitle>Behaviour Support</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-5">
        {/* Behaviour of Concern */}
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="w-full max-w-56">
              Behaviour of Concern
            </Label>
            <Textarea
              id="behaviour_of_concern"
              value={formData.behaviour_of_concern}
              onChange={(e) =>
                onFormChange('behaviour_of_concern', e.target.value)
              }
              rows={4}
              placeholder="Describe behaviour of concern..."
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* PBSP Engaged */}
        <div className="flex items-center gap-2.5">
          <Label className="w-full max-w-56">PBSP Engaged</Label>
          <Checkbox
            checked={formData.pbsp_engaged || false}
            disabled={!canEdit}
            onCheckedChange={(val) => onFormChange('pbsp_engaged', val === true)}
          />
        </div>

        {/* BSP Available */}
        <div className="flex items-center gap-2.5">
          <Label className="w-full max-w-56">BSP Available</Label>
          <Checkbox
            checked={formData.bsp_available || false}
            disabled={!canEdit}
            onCheckedChange={(val) =>
              onFormChange('bsp_available', val === true)
            }
          />
        </div>

        {/* Restrictive Practices */}
        <div className="flex items-center gap-2.5">
          <Label className="w-full max-w-56">Restrictive Practices</Label>
          <Checkbox
            checked={formData.restrictive_practices_yn || false}
            disabled={!canEdit}
            onCheckedChange={(val) =>
              onFormChange('restrictive_practices_yn', val === true)
            }
          />
        </div>

        {/* Specialist Name */}
        <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
          <Label className="w-full max-w-56">Specialist Name</Label>
          <Input
            id="specialist_name"
            value={formData.specialist_name || ''}
            disabled={!canEdit}
            onChange={(e) =>
              onFormChange('specialist_name', e.target.value)
            }
            placeholder="Enter specialist name..."
          />
        </div>

        {/* Specialist Contact Phone */}
        <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
          <Label className="w-full max-w-56">Specialist Phone</Label>
          <Input
            id="specialist_phone"
            value={formData.specialist_phone || ''}
            disabled={!canEdit}
            onChange={(e) =>
              onFormChange('specialist_phone', e.target.value)
            }
            placeholder="Specialist Phone number..."
          />
        </div>

        {/* Specialist Contact Email */}
        <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
          <Label className="w-full max-w-56">Specialist Email</Label>
          <Input
            id="specialist_email"
            value={formData.specialist_email || ''}
            disabled={!canEdit}
            onChange={(e) =>
              onFormChange('specialist_email', e.target.value)
            }
            placeholder="Specialist Email address..."
          />
        </div>

        {/* Restrictive Practice Authorisation */}
        <div className="flex items-center gap-2.5">
          <Label className="w-full max-w-56">
            Restrictive Practice Authorisation
          </Label>
          <Checkbox
            checked={formData.restrictive_practice_authorisation || false}
            disabled={!canEdit}
            onCheckedChange={(val) =>
              onFormChange(
                'restrictive_practice_authorisation',
                val === true
              )
            }
          />
        </div>

        {/* Restrictive Practice Details */}
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="w-full max-w-56">
              Restrictive Practice Details
            </Label>
            <Textarea
              id="restrictive_practice_details"
              value={formData.restrictive_practice_details}
              onChange={(e) =>
                onFormChange('restrictive_practice_details', e.target.value)
              }
              rows={4}
              placeholder="Describe restrictive practice details..."
              disabled={!canEdit}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
