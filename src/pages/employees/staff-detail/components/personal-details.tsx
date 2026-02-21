import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AvatarInput } from '@/components/image-input/avatar-input';

interface PersonalDetailsProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
  canEdit: boolean;
  validationErrors?: Record<string, string>;
}

export function PersonalDetails({
  formData,
  onFormChange,
  canEdit,
  validationErrors = {},
}: PersonalDetailsProps) {
  const handlePhotoChange = (file: File | null, dataURL: string | null) => {
    onFormChange('photo_file', file);
    onFormChange('photo_url_preview', dataURL);
  };

  return (
    <Card className="pb-2.5" id="personal_details">
      <CardHeader>
        <CardTitle>Personal Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2.5">
        {/* Profile Photo */}
        <div className="w-full">
          <div className="flex items-center flex-wrap gap-2.5">
            <Label className="flex w-full max-w-56">Profile Photo</Label>
            <div className="flex items-center gap-4">
              <AvatarInput
                value={formData.photo_url_preview ?? formData.photo_url ?? undefined}
                onChange={canEdit ? handlePhotoChange : () => {}}
                size="lg"
              />
              {canEdit && (
                <p className="text-xs text-muted-foreground">Click the photo to change it</p>
              )}
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Full Name *</Label>
            <div className="grow">
              <Input
                id="name"
                placeholder="Staff member name"
                value={formData.name || ''}
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
            <Label className="flex w-full max-w-56">
              Email {formData.status !== 'draft' && '*'}
            </Label>
            <div className="grow">
              <Input
                id="email"
                type="email"
                placeholder="staff@example.com"
                value={formData.email || ''}
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
            <Label className="flex w-full max-w-56">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phone || ''}
              onChange={(e) => onFormChange('phone', e.target.value)}
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
              value={formData.date_of_birth || ''}
              onChange={(e) => onFormChange('date_of_birth', e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Address</Label>
            <Textarea
              id="address"
              placeholder="Street address, city, state, postal code"
              value={formData.address || ''}
              onChange={(e) => onFormChange('address', e.target.value)}
              disabled={!canEdit}
              rows={3}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Hobbies</Label>
            <Textarea
              id="hobbies"
              placeholder="Staff member hobbies and interests"
              value={formData.hobbies || ''}
              onChange={(e) => onFormChange('hobbies', e.target.value)}
              disabled={!canEdit}
              rows={3}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Allergies</Label>
            <Textarea
              id="allergies"
              placeholder="Staff member allergies"
              value={formData.allergies || ''}
              onChange={(e) => onFormChange('allergies', e.target.value)}
              disabled={!canEdit}
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
