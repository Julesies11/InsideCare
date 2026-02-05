import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface MedicalRoutineProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export function MedicalRoutine({
  canEdit,
  formData,
  onFormChange,
}: MedicalRoutineProps) {
  return (
    <Card className="pb-2.5" id="medical-routine">
      <CardHeader>
        <CardTitle>Medical Routine</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-8">
        
        {/* Pharmacy */}
        <div className="space-y-5" id="medical-routine-pharmacy">
          <h3 className="text-lg font-semibold">Pharmacy</h3>
          <div className="grid gap-2.5">
            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <Label className="flex w-full max-w-56">Pharmacy Name</Label>
                <Input
                  id="pharmacy_name"
                  value={formData.pharmacy_name || ''}
                  onChange={(e) => onFormChange('pharmacy_name', e.target.value)}
                  placeholder="Enter pharmacy name..."
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <Label className="flex w-full max-w-56">Pharmacy Contact</Label>
                <Input
                  id="pharmacy_contact"
                  value={formData.pharmacy_contact || ''}
                  onChange={(e) => onFormChange('pharmacy_contact', e.target.value)}
                  placeholder="Enter pharmacy contact..."
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <Label className="flex w-full max-w-56">Pharmacy Location</Label>
                <Input
                  id="pharmacy_location"
                  value={formData.pharmacy_location || ''}
                  onChange={(e) => onFormChange('pharmacy_location', e.target.value)}
                  placeholder="Enter pharmacy location..."
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>
        </div>

        {/* General Practitioner */}
        <div className="space-y-5" id="medical-routine-gp">
          <h3 className="text-lg font-semibold">General Practitioner</h3>
          <div className="grid gap-2.5">
            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <Label className="flex w-full max-w-56">GP Name</Label>
                <Input
                  id="gp_name"
                  value={formData.gp_name || ''}
                  onChange={(e) => onFormChange('gp_name', e.target.value)}
                  placeholder="Enter GP name..."
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <Label className="flex w-full max-w-56">GP Contact</Label>
                <Input
                  id="gp_contact"
                  value={formData.gp_contact || ''}
                  onChange={(e) => onFormChange('gp_contact', e.target.value)}
                  placeholder="Enter GP contact..."
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <Label className="flex w-full max-w-56">GP Location</Label>
                <Input
                  id="gp_location"
                  value={formData.gp_location || ''}
                  onChange={(e) => onFormChange('gp_location', e.target.value)}
                  placeholder="Enter GP location..."
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Psychiatrist */}
        <div className="space-y-5" id="medical-routine-psychiatrist">
          <h3 className="text-lg font-semibold">Psychiatrist</h3>
          <div className="grid gap-2.5">
            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <Label className="flex w-full max-w-56">Psychiatrist Name</Label>
                <Input
                  id="psychiatrist_name"
                  value={formData.psychiatrist_name || ''}
                  onChange={(e) => onFormChange('psychiatrist_name', e.target.value)}
                  placeholder="Enter psychiatrist name..."
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <Label className="flex w-full max-w-56">Psychiatrist Contact</Label>
                <Input
                  id="psychiatrist_contact"
                  value={formData.psychiatrist_contact || ''}
                  onChange={(e) => onFormChange('psychiatrist_contact', e.target.value)}
                  placeholder="Enter psychiatrist contact..."
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <Label className="flex w-full max-w-56">Psychiatrist Location</Label>
                <Input
                  id="psychiatrist_location"
                  value={formData.psychiatrist_location || ''}
                  onChange={(e) => onFormChange('psychiatrist_location', e.target.value)}
                  placeholder="Enter psychiatrist location..."
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Any Other */}
        <div className="w-full" id="medical-routine-other">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">Any Other</Label>
            <Textarea
              id="medical_routine_other"
              value={formData.medical_routine_other || ''}
              onChange={(e) => onFormChange('medical_routine_other', e.target.value)}
              rows={5}
              placeholder="Describe any other medical routine information..."
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* General Process */}
        <div className="w-full" id="medical-routine-process">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <Label className="flex w-full max-w-56">General Process</Label>
            <Textarea
              id="medical_routine_general_process"
              value={formData.medical_routine_general_process || ''}
              onChange={(e) => onFormChange('medical_routine_general_process', e.target.value)}
              rows={5}
              placeholder="Describe the general medical routine process..."
              disabled={!canEdit}
            />
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
