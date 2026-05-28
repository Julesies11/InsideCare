import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings2, Activity, Droplet, Moon, Utensils, Navigation, ShowerHead, Brain, LucideIcon } from 'lucide-react';
import { BristolScalePicker } from '../bristol-scale-picker';
import { SeizureTypeMasterDialog } from '../seizure-type-master-dialog';
import { BehaviourTypeMasterDialog } from '../behaviour-type-master-dialog';
import { useSeizureTypesMaster } from '@/hooks/use-seizure-types-master';
import { useBehaviourTypesMaster } from '@/hooks/use-behaviour-types-master';
import { cn } from '@/lib/utils';

interface ShiftNoteTrackersSectionProps {
  canEdit: boolean;
  formData: Record<string, unknown>;
  onFormChange: (field: string, value: unknown) => void;
}

export function ShiftNoteTrackersSection({
  canEdit,
  formData,
  onFormChange,
}: ShiftNoteTrackersSectionProps) {
  const [seizureMasterOpen, setSeizureMasterOpen] = useState(false);
  const [behaviourMasterOpen, setBehaviourMasterOpen] = useState(false);
  const { data: seizureTypes = [] } = useSeizureTypesMaster();
  const { data: behaviourTypes = [] } = useBehaviourTypesMaster();

  const ModuleToggle = ({ 
    id, 
    label, 
    icon: Icon, 
    checked, 
    onChange 
  }: { id: string, label: string, icon: LucideIcon, checked: boolean, onChange: (val: boolean) => void }) => (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
      checked ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-muted/30 border-transparent grayscale hover:grayscale-0 hover:border-border"
    )} onClick={() => !disabled && onChange(!checked)}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-md", checked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
          <Icon className="size-4" />
        </div>
        <span className={cn("text-sm font-medium", checked ? "text-primary" : "text-muted-foreground")}>{label}</span>
      </div>
      <Checkbox 
        id={id} 
        checked={checked} 
        onCheckedChange={(val) => onChange(val === true)}
        disabled={!canEdit}
        className="pointer-events-none"
      />
    </div>
  );

  const disabled = !canEdit;

  return (
    <div className="space-y-6">
      {/* Module Selection */}
      <Card className="bg-muted/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Clinical Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <ModuleToggle 
              id="bowel_toggle" 
              label="Bowel Tracking" 
              icon={Droplet} 
              checked={!!formData.bowel_movement_occurred} 
              onChange={(v) => onFormChange('bowel_movement_occurred', v)} 
            />
            <ModuleToggle 
              id="seizure_toggle" 
              label="Seizure Activity" 
              icon={Activity} 
              checked={!!formData.seizure_occurred} 
              onChange={(v) => onFormChange('seizure_occurred', v)} 
            />
            <ModuleToggle 
              id="sleep_toggle" 
              label="Sleep Tracking" 
              icon={Moon} 
              checked={!!formData.sleep_occurred} 
              onChange={(v) => onFormChange('sleep_occurred', v)} 
            />
            <ModuleToggle 
              id="behaviour_toggle" 
              label="Behaviour Observations" 
              icon={Brain} 
              checked={!!formData.behaviour_observed} 
              onChange={(v) => onFormChange('behaviour_observed', v)} 
            />
            <ModuleToggle 
              id="community_toggle" 
              label="Community Participation" 
              icon={Navigation} 
              checked={!!formData.community_access_occurred} 
              onChange={(v) => onFormChange('community_access_occurred', v)} 
            />
            <ModuleToggle 
              id="nutrition_toggle" 
              label="Nutrition Tracker" 
              icon={Utensils} 
              checked={!!formData.meal_provided} 
              onChange={(v) => onFormChange('meal_provided', v)} 
            />
            <ModuleToggle 
              id="mtm_toggle" 
              label="Mealtime Management" 
              icon={Utensils} 
              checked={!!formData.mtm_meal_provided} 
              onChange={(v) => onFormChange('mtm_meal_provided', v)} 
            />
            <ModuleToggle 
              id="hygiene_toggle" 
              label="Hygiene Tracking" 
              icon={ShowerHead} 
              checked={!!formData.hygiene_support_required} 
              onChange={(v) => onFormChange('hygiene_support_required', v)} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Bowel Tracking */}
      {formData.bowel_movement_occurred && (
        <Card id="tracker_bowel" className="animate-in fade-in slide-in-from-top-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="size-4 text-primary" />
              Bowel Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Bristol Scale Type *</Label>
                <BristolScalePicker 
                  value={formData.bowel_bristol_scale} 
                  onChange={(v) => onFormChange('bowel_bristol_scale', v)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-4 md:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bowel_time">Time</Label>
                    <Input
                      id="bowel_time"
                      type="time"
                      value={formData.bowel_time || ''}
                      onChange={(e) => onFormChange('bowel_time', e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bowel_amount">Amount</Label>
                    <Select
                      value={formData.bowel_amount || 'none'}
                      onValueChange={(val) => onFormChange('bowel_amount', val === 'none' ? null : val)}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select amount" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select amount...</SelectItem>
                        <SelectItem value="Small">Small</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bowel_assistance_required">Assistance Required</Label>
                  <Select
                    value={formData.bowel_assistance_required || 'none'}
                    onValueChange={(val) => onFormChange('bowel_assistance_required', val === 'none' ? null : val)}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assistance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select assistance...</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="prompted">Prompted</SelectItem>
                      <SelectItem value="assisted">Assisted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bowel_notes">Extra Notes</Label>
              <Textarea
                id="bowel_notes"
                value={formData.bowel_notes || ''}
                onChange={(e) => onFormChange('bowel_notes', e.target.value)}
                placeholder="Any concerns or extra notes..."
                rows={2}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seizure Activity */}
      {formData.seizure_occurred && (
        <Card id="tracker_seizure" className="animate-in fade-in slide-in-from-top-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                Seizure Activity
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSeizureMasterOpen(true)}
                className="h-8 px-2 text-xs"
              >
                <Settings2 className="size-3 me-1.5" />
                Manage Types
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seizure_time_started">Time Started</Label>
                <Input
                  id="seizure_time_started"
                  type="time"
                  value={formData.seizure_time_started || ''}
                  onChange={(e) => onFormChange('seizure_time_started', e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seizure_duration_minutes">Duration (minutes)</Label>
                <Input
                  id="seizure_duration_minutes"
                  type="number"
                  min="0"
                  value={formData.seizure_duration_minutes || ''}
                  onChange={(e) => onFormChange('seizure_duration_minutes', e.target.value ? parseInt(e.target.value) : null)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="seizure_type_id">Seizure Type</Label>
                <Select
                  value={formData.seizure_type_id || 'none'}
                  onValueChange={(val) => onFormChange('seizure_type_id', val === 'none' ? null : val)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select type...</SelectItem>
                    {seizureTypes.filter(t => t.is_active).map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                    <SelectItem value="unknown">Unknown / Unsure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seizure_description">Description</Label>
              <Textarea
                id="seizure_description"
                value={formData.seizure_description || ''}
                onChange={(e) => onFormChange('seizure_description', e.target.value)}
                placeholder="Describe the seizure..."
                rows={3}
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-dashed">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seizure_injury_occurred">Injury sustained?</Label>
                  <Checkbox 
                    id="seizure_injury_occurred" 
                    checked={!!formData.seizure_injury_occurred}
                    onCheckedChange={(val) => onFormChange('seizure_injury_occurred', val === true)}
                    disabled={disabled}
                  />
                </div>
                {formData.seizure_injury_occurred && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-left-1">
                    <Label htmlFor="seizure_injury_description">Description of Injury</Label>
                    <Input 
                      id="seizure_injury_description"
                      value={formData.seizure_injury_description || ''}
                      onChange={(e) => onFormChange('seizure_injury_description', e.target.value)}
                      placeholder="Enter injury details..."
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seizure_emergency_services">Emergency services called?</Label>
                  <Checkbox 
                    id="seizure_emergency_services" 
                    checked={!!formData.seizure_emergency_services}
                    onCheckedChange={(val) => onFormChange('seizure_emergency_services', val === true)}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="seizure_notes">Other Concerns / Notes</Label>
                  <Input 
                    id="seizure_notes"
                    value={formData.seizure_notes || ''}
                    onChange={(e) => onFormChange('seizure_notes', e.target.value)}
                    placeholder="Extra notes..."
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sleep Tracking */}
      {formData.sleep_occurred && (
        <Card id="tracker_sleep" className="animate-in fade-in slide-in-from-top-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="size-4 text-primary" />
              Sleep Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sleep_type_period">Sleep Type</Label>
                <Select
                  value={formData.sleep_type_period || 'none'}
                  onValueChange={(val) => onFormChange('sleep_type_period', val === 'none' ? null : val)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    <SelectItem value="Day sleep">Day sleep</SelectItem>
                    <SelectItem value="Night sleep">Night sleep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sleep_start_time">Sleep Start Time</Label>
                <Input
                  id="sleep_start_time"
                  type="time"
                  value={formData.sleep_start_time || ''}
                  onChange={(e) => onFormChange('sleep_start_time', e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sleep_wake_time">Wake Up Time</Label>
                <Input
                  id="sleep_wake_time"
                  type="time"
                  value={formData.sleep_wake_time || ''}
                  onChange={(e) => onFormChange('sleep_wake_time', e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sleep_quality">Sleep Quality</Label>
                <Input
                  id="sleep_quality"
                  value={formData.sleep_quality || ''}
                  onChange={(e) => onFormChange('sleep_quality', e.target.value)}
                  placeholder="e.g. Restless, Deep"
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sleep_support_required">Support Required During Sleep</Label>
              <Textarea
                id="sleep_support_required"
                value={formData.sleep_support_required || ''}
                onChange={(e) => onFormChange('sleep_support_required', e.target.value)}
                placeholder="Describe supports..."
                rows={2}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Behaviour Observation */}
      {formData.behaviour_observed && (
        <Card id="tracker_behaviour" className="animate-in fade-in slide-in-from-top-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="size-4 text-primary" />
                Behaviour Observation
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setBehaviourMasterOpen(true)}
                className="h-8 px-2 text-xs"
              >
                <Settings2 className="size-3 me-1.5" />
                Manage Types
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="behaviour_type_id">Behaviour Type</Label>
                <Select
                  value={formData.behaviour_type_id || 'none'}
                  onValueChange={(val) => onFormChange('behaviour_type_id', val === 'none' ? null : val)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select type...</SelectItem>
                    {behaviourTypes.filter(t => t.is_active).map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="behaviour_intensity">Intensity</Label>
                <Select
                  value={formData.behaviour_intensity || 'none'}
                  onValueChange={(val) => onFormChange('behaviour_intensity', val === 'none' ? null : val)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select intensity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select intensity...</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="behaviour_notes">Notes</Label>
              <Textarea
                id="behaviour_notes"
                value={formData.behaviour_notes || ''}
                onChange={(e) => onFormChange('behaviour_notes', e.target.value)}
                placeholder="Context and response..."
                rows={3}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Community Participation */}
      {formData.community_access_occurred && (
        <Card id="tracker_community" className="animate-in fade-in slide-in-from-top-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="size-4 text-primary" />
              Community Participation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="community_activity_type">Activity Type</Label>
                <Input
                  id="community_activity_type"
                  value={formData.community_activity_type || ''}
                  onChange={(e) => onFormChange('community_activity_type', e.target.value)}
                  placeholder="e.g. Grocery shopping"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="community_location">Location</Label>
                <Input
                  id="community_location"
                  value={formData.community_location || ''}
                  onChange={(e) => onFormChange('community_location', e.target.value)}
                  placeholder="Enter location..."
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="community_engagement_level">Engagement Level</Label>
                <Input
                  id="community_engagement_level"
                  value={formData.community_engagement_level || ''}
                  onChange={(e) => onFormChange('community_engagement_level', e.target.value)}
                  placeholder="e.g. Highly engaged"
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="community_notes">Notes</Label>
              <Textarea
                id="community_notes"
                value={formData.community_notes || ''}
                onChange={(e) => onFormChange('community_notes', e.target.value)}
                placeholder="Experience summary..."
                rows={2}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nutrition Tracker */}
      {formData.meal_provided && (
        <Card id="tracker_nutrition" className="animate-in fade-in slide-in-from-top-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="size-4 text-primary" />
              Nutrition Tracker
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nutrition_meal_type">Meal Type</Label>
                <Select
                  value={formData.nutrition_meal_type || 'none'}
                  onValueChange={(val) => onFormChange('nutrition_meal_type', val === 'none' ? null : val)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    <SelectItem value="Bfast">Breakfast</SelectItem>
                    <SelectItem value="Lunch">Lunch</SelectItem>
                    <SelectItem value="Dinner">Dinner</SelectItem>
                    <SelectItem value="Snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nutrition_intake">Intake</Label>
                <Select
                  value={formData.nutrition_intake || 'none'}
                  onValueChange={(val) => onFormChange('nutrition_intake', val === 'none' ? null : val)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    <SelectItem value="Full">Full</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nutrition_fluids_intake">Fluids Intake</Label>
                <Input
                  id="nutrition_fluids_intake"
                  value={formData.nutrition_fluids_intake || ''}
                  onChange={(e) => onFormChange('nutrition_fluids_intake', e.target.value)}
                  placeholder="e.g. 500ml water"
                  disabled={disabled}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nutrition_assistance_needed">Assistance Needed</Label>
                <Input
                  id="nutrition_assistance_needed"
                  value={formData.nutrition_assistance_needed || ''}
                  onChange={(e) => onFormChange('nutrition_assistance_needed', e.target.value)}
                  placeholder="Describe help provided..."
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nutrition_refusal_alternatives">Alternatives Offered (if refused)</Label>
                <Input
                  id="nutrition_refusal_alternatives"
                  value={formData.nutrition_refusal_alternatives || ''}
                  onChange={(e) => onFormChange('nutrition_refusal_alternatives', e.target.value)}
                  placeholder="Describe alternatives..."
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nutrition_notes">Notes</Label>
              <Textarea
                id="nutrition_notes"
                value={formData.nutrition_notes || ''}
                onChange={(e) => onFormChange('nutrition_notes', e.target.value)}
                placeholder="Meal details..."
                rows={2}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mealtime Management */}
      {formData.mtm_meal_provided && (
        <Card id="tracker_mtm" className="animate-in fade-in slide-in-from-top-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="size-4 text-primary" />
              Mealtime Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mtm_diet_type">Diet Type</Label>
                <Select
                  value={formData.mtm_diet_type || 'none'}
                  onValueChange={(val) => onFormChange('mtm_diet_type', val === 'none' ? null : val)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select diet..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select diet...</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Soft">Soft</SelectItem>
                    <SelectItem value="Minced">Minced</SelectItem>
                    <SelectItem value="Pureed">Pureed</SelectItem>
                    <SelectItem value="Liquidised">Liquidised</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mtm_fluids">Fluids Consistency</Label>
                <Select
                  value={formData.mtm_fluids || 'none'}
                  onValueChange={(val) => onFormChange('mtm_fluids', val === 'none' ? null : val)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select consistency..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select consistency...</SelectItem>
                    <SelectItem value="Thin">Thin</SelectItem>
                    <SelectItem value="Mildly thick">Mildly thick</SelectItem>
                    <SelectItem value="Extremely thick">Extremely thick</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-dashed">
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/20 border">
                <Label className="text-xs">Texture Correct?</Label>
                <Checkbox 
                  checked={!!formData.mtm_texture_correct}
                  onCheckedChange={(v) => onFormChange('mtm_texture_correct', v === true)}
                  disabled={disabled}
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/20 border">
                <Label className="text-xs">Fluid Correct?</Label>
                <Checkbox 
                  checked={!!formData.mtm_consistency_correct}
                  onCheckedChange={(v) => onFormChange('mtm_consistency_correct', v === true)}
                  disabled={disabled}
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/20 border">
                <Label className="text-xs">Positioning Appropriate?</Label>
                <Checkbox 
                  checked={!!formData.mtm_positioning_appropriate}
                  onCheckedChange={(v) => onFormChange('mtm_positioning_appropriate', v === true)}
                  disabled={disabled}
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/20 border">
                <Label className="text-xs">Supervision Provided?</Label>
                <Checkbox 
                  checked={!!formData.mtm_supervision_required}
                  onCheckedChange={(v) => onFormChange('mtm_supervision_required', v === true)}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mtm_swallowing_concerns">Any swallowing concerns?</Label>
              <Select
                value={formData.mtm_swallowing_concerns || 'no'}
                onValueChange={(val) => onFormChange('mtm_swallowing_concerns', val)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="Coughing">Coughing</SelectItem>
                  <SelectItem value="Choking">Choking</SelectItem>
                  <SelectItem value="Wet voice">Wet voice</SelectItem>
                  <SelectItem value="Food refusal linked to swallowing">Food refusal linked to swallowing</SelectItem>
                  <SelectItem value="Prolonged eating time">Prolonged eating time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mtm_meal_intake">Meal Intake</Label>
                  <Select
                    value={formData.mtm_meal_intake || 'none'}
                    onValueChange={(val) => onFormChange('mtm_meal_intake', val === 'none' ? null : val)}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select intake..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select intake...</SelectItem>
                      <SelectItem value="Full">Full</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Minimal">Minimal</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input 
                  placeholder="Intake notes..."
                  value={formData.mtm_meal_intake_notes || ''}
                  onChange={(e) => onFormChange('mtm_meal_intake_notes', e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mtm_fluid_intake">Fluid Intake</Label>
                  <Select
                    value={formData.mtm_fluid_intake || 'none'}
                    onValueChange={(val) => onFormChange('mtm_fluid_intake', val === 'none' ? null : val)}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select intake..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select intake...</SelectItem>
                      <SelectItem value="Adequate">Adequate</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Refused">Refused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input 
                  placeholder="Fluid intake notes..."
                  value={formData.mtm_fluid_intake_notes || ''}
                  onChange={(e) => onFormChange('mtm_fluid_intake_notes', e.target.value)}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mtm_notes">Additional Mealtime Notes</Label>
              <Textarea
                id="mtm_notes"
                value={formData.mtm_notes || ''}
                onChange={(e) => onFormChange('mtm_notes', e.target.value)}
                placeholder="General comments..."
                rows={2}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hygiene Tracking */}
      {formData.hygiene_support_required && (
        <Card id="tracker_hygiene" className="animate-in fade-in slide-in-from-top-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShowerHead className="size-4 text-primary" />
              Hygiene Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hygiene_shower">Shower</Label>
                <Select
                  value={formData.hygiene_shower || 'none'}
                  onValueChange={(val) => onFormChange('hygiene_shower', val === 'none' ? null : val)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    <SelectItem value="Independently">Independently</SelectItem>
                    <SelectItem value="With prompting">With prompting</SelectItem>
                    <SelectItem value="Supervision required">Supervision required</SelectItem>
                    <SelectItem value="Assistance needed">Assistance needed</SelectItem>
                    <SelectItem value="Refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hygiene_oral_care">Oral Care</Label>
                <Select
                  value={formData.hygiene_oral_care || 'none'}
                  onValueChange={(val) => onFormChange('hygiene_oral_care', val === 'none' ? null : val)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    <SelectItem value="Independently">Independently</SelectItem>
                    <SelectItem value="With prompting">With prompting</SelectItem>
                    <SelectItem value="Supervision required">Supervision required</SelectItem>
                    <SelectItem value="Assistance needed">Assistance needed</SelectItem>
                    <SelectItem value="Refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hygiene_toileting">Toileting</Label>
                <Select
                  value={formData.hygiene_toileting || 'none'}
                  onValueChange={(val) => onFormChange('hygiene_toileting', val === 'none' ? null : val)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    <SelectItem value="Independently">Independently</SelectItem>
                    <SelectItem value="With prompting">With prompting</SelectItem>
                    <SelectItem value="Supervision required">Supervision required</SelectItem>
                    <SelectItem value="Assistance needed">Assistance needed</SelectItem>
                    <SelectItem value="Refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hygiene_grooming">Grooming</Label>
                <Select
                  value={formData.hygiene_grooming || 'none'}
                  onValueChange={(val) => onFormChange('hygiene_grooming', val === 'none' ? null : val)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    <SelectItem value="Independently">Independently</SelectItem>
                    <SelectItem value="With prompting">With prompting</SelectItem>
                    <SelectItem value="Supervision required">Supervision required</SelectItem>
                    <SelectItem value="Assistance needed">Assistance needed</SelectItem>
                    <SelectItem value="Refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hygiene_observed_concerns">Observed Concerns</Label>
              <Input 
                id="hygiene_observed_concerns"
                value={formData.hygiene_observed_concerns || ''}
                onChange={(e) => onFormChange('hygiene_observed_concerns', e.target.value)}
                placeholder="e.g. Skin integrity, Rashes"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hygiene_notes">Notes</Label>
              <Textarea
                id="hygiene_notes"
                value={formData.hygiene_notes || ''}
                onChange={(e) => onFormChange('hygiene_notes', e.target.value)}
                placeholder="Extra details..."
                rows={2}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <SeizureTypeMasterDialog
        open={seizureMasterOpen}
        onClose={() => setSeizureMasterOpen(false)}
        canEdit={canEdit}
      />

      <BehaviourTypeMasterDialog
        open={behaviourMasterOpen}
        onClose={() => setBehaviourMasterOpen(false)}
        canEdit={canEdit}
      />
    </div>
  );
}
