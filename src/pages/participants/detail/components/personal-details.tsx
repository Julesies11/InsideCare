import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Participant } from '@/models/participant';
import { useHouses } from '@/hooks/use-houses';
import { AvatarInput } from '@/components/image-input/avatar-input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface PersonalDetailsProps {
  participant?: Participant;
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
  onSave: () => void;
  validationErrors?: Record<string, string>;
}

export function PersonalDetails({
  participant,
  canEdit,
  formData,
  onFormChange,
  onSave,
  validationErrors = {},
}: PersonalDetailsProps) {
  const { houses } = useHouses();
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
  };

  const handlePhotoChange = (file: File | null, dataURL: string | null) => {
    // Store the file and dataURL locally, will upload when Save is clicked
    if (dataURL) {
      onFormChange('photo_url', dataURL);
      onFormChange('photo_file', file);
    } else {
      onFormChange('photo_url', '');
      onFormChange('photo_file', null);
    }
  };

  function getInitials(name: string): string {
    if (!name) return 'NA';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <Card className="pb-2.5" id="personal_details">
      <CardHeader>
        <CardTitle>Personal Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        {/* Avatar Section */}
        <div className="flex items-center flex-wrap gap-2.5">
          <Label className="flex w-full max-w-56">Photo</Label>
          <div className="flex items-center gap-4">
            <AvatarInput
              value={formData.photo_url}
              onChange={handlePhotoChange}
              size="lg"
            />
            {uploadingPhoto && <span className="text-sm text-muted-foreground">Uploading...</span>}
            {!canEdit && <span className="text-sm text-muted-foreground">View only</span>}
          </div>
        </div>

        {/* Form Fields */}
        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Full Name {formData.status !== 'draft' && '*'}</Label>
            <div className="grow">
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onFormChange('name', e.target.value)}
                disabled={!canEdit}
                className={validationErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {validationErrors.name && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">NDIS Number</Label>
            <Input
              id="ndis_number"
              value={formData.ndis_number}
              onChange={(e) => onFormChange('ndis_number', e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => onFormChange('date_of_birth', e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">House Phone</Label>
            <Input
              id="house_phone"
              type="tel"
              value={formData.house_phone}
              onChange={(e) => onFormChange('house_phone', e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Personal Mobile</Label>
            <Input
              id="personal_mobile"
              type="tel"
              value={formData.personal_mobile}
              onChange={(e) => onFormChange('personal_mobile', e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Email {formData.status !== 'draft' && '*'}</Label>
            <div className="grow">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onFormChange('email', e.target.value)}
                disabled={!canEdit}
                className={validationErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {validationErrors.email && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
              )}
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => onFormChange('address', e.target.value)}
              rows={2}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Label className="flex w-full max-w-56">Support Level</Label>
          <div className="grow">
            <Select
              value={formData.support_level}
              onValueChange={(value) => onFormChange('support_level', value)}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select support level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="intensive">Intensive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Support Coordinator</Label>
            <Input
              id="support_coordinator"
              value={formData.support_coordinator}
              onChange={(e) => onFormChange('support_coordinator', e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Label className="flex w-full max-w-56">House</Label>
          <div className="grow">
            <Select
              value={formData.house_id}
              onValueChange={(value) => onFormChange('house_id', value)}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select house" />
              </SelectTrigger>
              <SelectContent>
                {houses?.map((house) => (
                  <SelectItem key={house.id} value={house.id}>
                    {house.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Label className="flex w-full max-w-56">Status</Label>
          <div className="grow">
            <Select
              value={formData.status}
              onValueChange={(value) => onFormChange('status', value)}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
