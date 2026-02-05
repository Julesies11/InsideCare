import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SupportNeedsProps {
  canEdit: boolean;
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export function SupportNeeds({
  canEdit,
  formData,
  onFormChange,
}: SupportNeedsProps) {
  return (
    <Card className="pb-2.5" id="support-needs">
      <CardHeader>
        <CardTitle>Support Needs</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8">
        
        {/* Personal Care and Routine */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold">Personal Care and Routine</h3>
          <div className="grid gap-5">
            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <Label className="flex w-full max-w-56">Routine</Label>
                <Textarea
                  id="routine"
                  value={formData.routine || ''}
                  onChange={(e) => onFormChange('routine', e.target.value)}
                  rows={5}
                  placeholder="Describe the daily routine..."
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <Label className="flex w-full max-w-56">Hygiene Support Required</Label>
                <Textarea
                  id="hygiene_support"
                  value={formData.hygiene_support || ''}
                  onChange={(e) => onFormChange('hygiene_support', e.target.value)}
                  rows={5}
                  placeholder="Describe hygiene support needs..."
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobility */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold">Mobility</h3>
          <div className="w-full">
            <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
              <Label className="flex w-full max-w-56">Mobility Support Required</Label>
              <Textarea
                id="mobility_support"
                value={formData.mobility_support || ''}
                onChange={(e) => onFormChange('mobility_support', e.target.value)}
                rows={5}
                placeholder="Describe mobility support needs..."
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {/* Meal Preparation and Kitchen Safety */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold">Meal Preparation and Kitchen Safety</h3>
          <div className="w-full">
            <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
              <Label className="flex w-full max-w-56">Meal Preparation Support Needs</Label>
              <Textarea
                id="meal_prep_support"
                value={formData.meal_prep_support || ''}
                onChange={(e) => onFormChange('meal_prep_support', e.target.value)}
                rows={5}
                placeholder="Describe meal preparation and kitchen safety support needs..."
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {/* Household Tasks */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold">Household Tasks</h3>
          <div className="w-full">
            <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
              <Label className="flex w-full max-w-56">Household Support Needs</Label>
              <Textarea
                id="household_support"
                value={formData.household_support || ''}
                onChange={(e) => onFormChange('household_support', e.target.value)}
                rows={5}
                placeholder="Describe household tasks support needs..."
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {/* Communication */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold">Communication</h3>
          <div className="grid gap-5">
            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <Label className="flex w-full max-w-56">Preferred Communication Type</Label>
                <Select
                  value={formData.communication_type || ''}
                  onValueChange={(value) => onFormChange('communication_type', value)}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select communication type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verbal">Verbal</SelectItem>
                    <SelectItem value="non_verbal">Non-verbal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <Label className="flex w-full max-w-56">Communication Type Notes</Label>
                <Textarea
                  id="communication_notes"
                  value={formData.communication_notes || ''}
                  onChange={(e) => onFormChange('communication_notes', e.target.value)}
                  rows={4}
                  placeholder="Describe communication type preferences..."
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <Label className="flex w-full max-w-56">Communication & Language Needs</Label>
                <Textarea
                  id="communication_language_needs"
                  value={formData.communication_language_needs || ''}
                  onChange={(e) => onFormChange('communication_language_needs', e.target.value)}
                  rows={4}
                  placeholder="Describe how to communicate (e.g., firm tone, constant validation, etc.)..."
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Finances */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold">Finances</h3>
          <div className="w-full">
            <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
              <Label className="flex w-full max-w-56">Finance Support Needs</Label>
              <Textarea
                id="finance_support"
                value={formData.finance_support || ''}
                onChange={(e) => onFormChange('finance_support', e.target.value)}
                rows={5}
                placeholder="Describe financial management support needs..."
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {/* Health and Wellbeing */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold">Health and Wellbeing</h3>
          <div className="w-full">
            <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
              <Label className="flex w-full max-w-56">Health & Wellbeing Support Needs</Label>
              <Textarea
                id="health_wellbeing_support"
                value={formData.health_wellbeing_support || ''}
                onChange={(e) => onFormChange('health_wellbeing_support', e.target.value)}
                rows={5}
                placeholder="Describe health and wellbeing support needs..."
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {/* Cultural and Religious */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold">Cultural and Religious</h3>
          <div className="w-full">
            <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
              <Label className="flex w-full max-w-56">Cultural and Religious Support Needs</Label>
              <Textarea
                id="cultural_religious_support"
                value={formData.cultural_religious_support || ''}
                onChange={(e) => onFormChange('cultural_religious_support', e.target.value)}
                rows={5}
                placeholder="Describe cultural and religious support needs..."
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {/* Other */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold">Other</h3>
          <div className="w-full">
            <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
              <Label className="flex w-full max-w-56">Any Other Support Needs</Label>
              <Textarea
                id="other_support"
                value={formData.other_support || ''}
                onChange={(e) => onFormChange('other_support', e.target.value)}
                rows={5}
                placeholder="Describe any other support needs..."
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
