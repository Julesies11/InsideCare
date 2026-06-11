import { useState } from 'react';
import {
  Activity,
  Brain,
  Droplet,
  LucideIcon,
  Moon,
  Navigation,
  Settings2,
  ShowerHead,
  Utensils,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBehaviourTypesMaster } from '@/hooks/use-behaviour-types-master';
import { useSeizureTypesMaster } from '@/hooks/use-seizure-types-master';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BehaviourTypeMasterDialog } from '../behaviour-type-master-dialog';
import { BristolScalePicker } from '../bristol-scale-picker';
import { SeizureTypeMasterDialog } from '../seizure-type-master-dialog';

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

  const disabled = !canEdit;

  const participant = formData.participant as any;
  const showBowel = !!participant?.track_bowel;
  const showSeizure = !!participant?.track_seizure;
  const showSleep = !!participant?.track_sleep;
  const showBehaviour = !!participant?.track_behaviour;
  const showCommunity = !!participant?.track_community;
  const showNutrition = !!participant?.track_nutrition;
  const showMtm = !!participant?.track_mtm;
  const showHygiene = !!participant?.track_hygiene;

  return (
    <div className="space-y-6">
      {/* Bowel Tracking */}
      {showBowel && (
        <Card
          id="tracker_bowel"
          className="animate-in fade-in slide-in-from-top-2"
        >
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
                      onChange={(e) =>
                        onFormChange('bowel_time', e.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bowel_amount">Amount</Label>
                    <Select
                      value={formData.bowel_amount || 'none'}
                      onValueChange={(val) =>
                        onFormChange(
                          'bowel_amount',
                          val === 'none' ? null : val,
                        )
                      }
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
                  <Label htmlFor="bowel_assistance_required">
                    Assistance Required
                  </Label>
                  <Select
                    value={formData.bowel_assistance_required || 'none'}
                    onValueChange={(val) =>
                      onFormChange(
                        'bowel_assistance_required',
                        val === 'none' ? null : val,
                      )
                    }
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
      {showSeizure && (
        <Card
          id="tracker_seizure"
          className="animate-in fade-in slide-in-from-top-2"
        >
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
                  onChange={(e) =>
                    onFormChange('seizure_time_started', e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seizure_duration_minutes">
                  Duration (minutes)
                </Label>
                <Input
                  id="seizure_duration_minutes"
                  type="number"
                  min="0"
                  value={formData.seizure_duration_minutes || ''}
                  onChange={(e) =>
                    onFormChange(
                      'seizure_duration_minutes',
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="seizure_type_id">Seizure Type</Label>
                <Select
                  value={formData.seizure_type_id || 'none'}
                  onValueChange={(val) =>
                    onFormChange('seizure_type_id', val === 'none' ? null : val)
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select type...</SelectItem>
                    {seizureTypes
                      .filter((t) => t.is_active)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
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
                onChange={(e) =>
                  onFormChange('seizure_description', e.target.value)
                }
                placeholder="Describe the seizure..."
                rows={3}
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-dashed">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seizure_injury_occurred">
                    Seizure Injury?
                  </Label>
                  <RadioGroup
                    value={
                      formData.seizure_injury_occurred === true
                        ? 'yes'
                        : formData.seizure_injury_occurred === false
                          ? 'no'
                          : ''
                    }
                    onValueChange={(val) =>
                      onFormChange(
                        'seizure_injury_occurred',
                        val === 'yes' ? true : val === 'no' ? false : null,
                      )
                    }
                    disabled={disabled}
                    className="flex items-center gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="yes"
                        id="seizure_injury_yes"
                        size="sm"
                      />
                      <Label
                        htmlFor="seizure_injury_yes"
                        className="text-xs font-normal cursor-pointer"
                      >
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="no"
                        id="seizure_injury_no"
                        size="sm"
                      />
                      <Label
                        htmlFor="seizure_injury_no"
                        className="text-xs font-normal cursor-pointer"
                      >
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                {formData.seizure_injury_occurred && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-left-1">
                    <Label htmlFor="seizure_injury_description">
                      Description of Injury
                    </Label>
                    <Input
                      id="seizure_injury_description"
                      value={formData.seizure_injury_description || ''}
                      onChange={(e) =>
                        onFormChange(
                          'seizure_injury_description',
                          e.target.value,
                        )
                      }
                      placeholder="Enter injury details..."
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seizure_emergency_services">
                    Emergency services?
                  </Label>
                  <RadioGroup
                    value={
                      formData.seizure_emergency_services === true
                        ? 'yes'
                        : formData.seizure_emergency_services === false
                          ? 'no'
                          : ''
                    }
                    onValueChange={(val) =>
                      onFormChange(
                        'seizure_emergency_services',
                        val === 'yes' ? true : val === 'no' ? false : null,
                      )
                    }
                    disabled={disabled}
                    className="flex items-center gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="yes"
                        id="seizure_emergency_yes"
                        size="sm"
                      />
                      <Label
                        htmlFor="seizure_emergency_yes"
                        className="text-xs font-normal cursor-pointer"
                      >
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="no"
                        id="seizure_emergency_no"
                        size="sm"
                      />
                      <Label
                        htmlFor="seizure_emergency_no"
                        className="text-xs font-normal cursor-pointer"
                      >
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="seizure_notes">Other Concerns / Notes</Label>
                  <Input
                    id="seizure_notes"
                    value={formData.seizure_notes || ''}
                    onChange={(e) =>
                      onFormChange('seizure_notes', e.target.value)
                    }
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
      {showSleep && (
        <Card
          id="tracker_sleep"
          className="animate-in fade-in slide-in-from-top-2"
        >
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
                  onValueChange={(val) =>
                    onFormChange(
                      'sleep_type_period',
                      val === 'none' ? null : val,
                    )
                  }
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
                  onChange={(e) =>
                    onFormChange('sleep_start_time', e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sleep_wake_time">Wake Up Time</Label>
                <Input
                  id="sleep_wake_time"
                  type="time"
                  value={formData.sleep_wake_time || ''}
                  onChange={(e) =>
                    onFormChange('sleep_wake_time', e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sleep_quality">Sleep Quality</Label>
                <Input
                  id="sleep_quality"
                  value={formData.sleep_quality || ''}
                  onChange={(e) =>
                    onFormChange('sleep_quality', e.target.value)
                  }
                  placeholder="e.g. Restless, Deep"
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sleep_support_required">
                Support Required During Sleep
              </Label>
              <Textarea
                id="sleep_support_required"
                value={formData.sleep_support_required || ''}
                onChange={(e) =>
                  onFormChange('sleep_support_required', e.target.value)
                }
                placeholder="Describe supports..."
                rows={2}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Behaviour Observation */}
      {showBehaviour && (
        <Card
          id="tracker_behaviour"
          className="animate-in fade-in slide-in-from-top-2"
        >
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
                  onValueChange={(val) =>
                    onFormChange(
                      'behaviour_type_id',
                      val === 'none' ? null : val,
                    )
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select type...</SelectItem>
                    {behaviourTypes
                      .filter((t) => t.is_active)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="behaviour_intensity">Intensity</Label>
                <Select
                  value={formData.behaviour_intensity || 'none'}
                  onValueChange={(val) =>
                    onFormChange(
                      'behaviour_intensity',
                      val === 'none' ? null : val,
                    )
                  }
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
                onChange={(e) =>
                  onFormChange('behaviour_notes', e.target.value)
                }
                placeholder="Context and response..."
                rows={3}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Community Participation */}
      {showCommunity && (
        <Card
          id="tracker_community"
          className="animate-in fade-in slide-in-from-top-2"
        >
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
                  onChange={(e) =>
                    onFormChange('community_activity_type', e.target.value)
                  }
                  placeholder="e.g. Grocery shopping"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="community_location">Location</Label>
                <Input
                  id="community_location"
                  value={formData.community_location || ''}
                  onChange={(e) =>
                    onFormChange('community_location', e.target.value)
                  }
                  placeholder="Enter location..."
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="community_engagement_level">
                  Engagement Level
                </Label>
                <Input
                  id="community_engagement_level"
                  value={formData.community_engagement_level || ''}
                  onChange={(e) =>
                    onFormChange('community_engagement_level', e.target.value)
                  }
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
                onChange={(e) =>
                  onFormChange('community_notes', e.target.value)
                }
                placeholder="Experience summary..."
                rows={2}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nutrition Tracker */}
      {showNutrition && (
        <Card
          id="tracker_nutrition"
          className="animate-in fade-in slide-in-from-top-2"
        >
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
                  onValueChange={(val) =>
                    onFormChange(
                      'nutrition_meal_type',
                      val === 'none' ? null : val,
                    )
                  }
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
                  onValueChange={(val) =>
                    onFormChange(
                      'nutrition_intake',
                      val === 'none' ? null : val,
                    )
                  }
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
                  onChange={(e) =>
                    onFormChange('nutrition_fluids_intake', e.target.value)
                  }
                  placeholder="e.g. 500ml water"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nutrition_assistance_needed">
                  Assistance Needed
                </Label>
                <Input
                  id="nutrition_assistance_needed"
                  value={formData.nutrition_assistance_needed || ''}
                  onChange={(e) =>
                    onFormChange('nutrition_assistance_needed', e.target.value)
                  }
                  placeholder="Describe help provided..."
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nutrition_refusal_alternatives">
                  Alternatives Offered (if refused)
                </Label>
                <Input
                  id="nutrition_refusal_alternatives"
                  value={formData.nutrition_refusal_alternatives || ''}
                  onChange={(e) =>
                    onFormChange(
                      'nutrition_refusal_alternatives',
                      e.target.value,
                    )
                  }
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
                onChange={(e) =>
                  onFormChange('nutrition_notes', e.target.value)
                }
                placeholder="Meal details..."
                rows={2}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mealtime Management */}
      {showMtm && (
        <Card
          id="tracker_mtm"
          className="animate-in fade-in slide-in-from-top-2"
        >
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
                  onValueChange={(val) =>
                    onFormChange('mtm_diet_type', val === 'none' ? null : val)
                  }
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
                  onValueChange={(val) =>
                    onFormChange('mtm_fluids', val === 'none' ? null : val)
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select consistency..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select consistency...</SelectItem>
                    <SelectItem value="Thin">Thin</SelectItem>
                    <SelectItem value="Mildly thick">Mildly thick</SelectItem>
                    <SelectItem value="Extremely thick">
                      Extremely thick
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-dashed">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/20 border">
                  <Label className="text-xs">
                    Correct food texture provided?
                  </Label>
                  <RadioGroup
                    value={
                      formData.mtm_texture_correct === true
                        ? 'yes'
                        : formData.mtm_texture_correct === false
                          ? 'no'
                          : ''
                    }
                    onValueChange={(val) =>
                      onFormChange(
                        'mtm_texture_correct',
                        val === 'yes' ? true : val === 'no' ? false : null,
                      )
                    }
                    disabled={disabled}
                    className="flex items-center gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="yes"
                        id="mtm_texture_yes"
                        size="sm"
                      />
                      <Label
                        htmlFor="mtm_texture_yes"
                        className="text-xs font-normal cursor-pointer"
                      >
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="no"
                        id="mtm_texture_no"
                        size="sm"
                      />
                      <Label
                        htmlFor="mtm_texture_no"
                        className="text-xs font-normal cursor-pointer"
                      >
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                {formData.mtm_texture_correct === false && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                    <Label
                      htmlFor="mtm_texture_notes"
                      className="text-xs text-muted-foreground"
                    >
                      Describe why food texture was not correct
                    </Label>
                    <Textarea
                      id="mtm_texture_notes"
                      value={(formData.mtm_texture_notes as string) || ''}
                      onChange={(e) =>
                        onFormChange('mtm_texture_notes', e.target.value)
                      }
                      placeholder="Enter details..."
                      rows={2}
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/20 border">
                  <Label className="text-xs">Correct fluid consistency?</Label>
                  <RadioGroup
                    value={
                      formData.mtm_consistency_correct === true
                        ? 'yes'
                        : formData.mtm_consistency_correct === false
                          ? 'no'
                          : ''
                    }
                    onValueChange={(val) =>
                      onFormChange(
                        'mtm_consistency_correct',
                        val === 'yes' ? true : val === 'no' ? false : null,
                      )
                    }
                    disabled={disabled}
                    className="flex items-center gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="yes"
                        id="mtm_fluid_yes"
                        size="sm"
                      />
                      <Label
                        htmlFor="mtm_fluid_yes"
                        className="text-xs font-normal cursor-pointer"
                      >
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="mtm_fluid_no" size="sm" />
                      <Label
                        htmlFor="mtm_fluid_no"
                        className="text-xs font-normal cursor-pointer"
                      >
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                {formData.mtm_consistency_correct === false && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                    <Label
                      htmlFor="mtm_consistency_notes"
                      className="text-xs text-muted-foreground"
                    >
                      Describe why fluid consistency was not correct
                    </Label>
                    <Textarea
                      id="mtm_consistency_notes"
                      value={(formData.mtm_consistency_notes as string) || ''}
                      onChange={(e) =>
                        onFormChange('mtm_consistency_notes', e.target.value)
                      }
                      placeholder="Enter details..."
                      rows={2}
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/20 border">
                  <Label className="text-xs">Positioning appropriate?</Label>
                  <RadioGroup
                    value={
                      formData.mtm_positioning_appropriate === true
                        ? 'yes'
                        : formData.mtm_positioning_appropriate === false
                          ? 'no'
                          : ''
                    }
                    onValueChange={(val) =>
                      onFormChange(
                        'mtm_positioning_appropriate',
                        val === 'yes' ? true : val === 'no' ? false : null,
                      )
                    }
                    disabled={disabled}
                    className="flex items-center gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="mtm_pos_yes" size="sm" />
                      <Label
                        htmlFor="mtm_pos_yes"
                        className="text-xs font-normal cursor-pointer"
                      >
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="mtm_pos_no" size="sm" />
                      <Label
                        htmlFor="mtm_pos_no"
                        className="text-xs font-normal cursor-pointer"
                      >
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                {formData.mtm_positioning_appropriate === false && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                    <Label
                      htmlFor="mtm_positioning_notes"
                      className="text-xs text-muted-foreground"
                    >
                      Describe why positioning was not appropriate
                    </Label>
                    <Textarea
                      id="mtm_positioning_notes"
                      value={(formData.mtm_positioning_notes as string) || ''}
                      onChange={(e) =>
                        onFormChange('mtm_positioning_notes', e.target.value)
                      }
                      placeholder="Enter details..."
                      rows={2}
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/20 border">
                  <Label className="text-xs">Supervision required?</Label>
                  <RadioGroup
                    value={
                      formData.mtm_supervision_required === true
                        ? 'yes'
                        : formData.mtm_supervision_required === false
                          ? 'no'
                          : ''
                    }
                    onValueChange={(val) =>
                      onFormChange(
                        'mtm_supervision_required',
                        val === 'yes' ? true : val === 'no' ? false : null,
                      )
                    }
                    disabled={disabled}
                    className="flex items-center gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="mtm_sup_yes" size="sm" />
                      <Label
                        htmlFor="mtm_sup_yes"
                        className="text-xs font-normal cursor-pointer"
                      >
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="mtm_sup_no" size="sm" />
                      <Label
                        htmlFor="mtm_sup_no"
                        className="text-xs font-normal cursor-pointer"
                      >
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                {formData.mtm_supervision_required === true && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                    <Label
                      htmlFor="mtm_supervision_notes"
                      className="text-xs text-muted-foreground"
                    >
                      Describe supervision required
                    </Label>
                    <Textarea
                      id="mtm_supervision_notes"
                      value={(formData.mtm_supervision_notes as string) || ''}
                      onChange={(e) =>
                        onFormChange('mtm_supervision_notes', e.target.value)
                      }
                      placeholder="Enter details..."
                      rows={2}
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mtm_swallowing_concerns">
                Any swallowing concerns?
              </Label>
              <Select
                value={formData.mtm_swallowing_concerns || 'no'}
                onValueChange={(val) =>
                  onFormChange('mtm_swallowing_concerns', val)
                }
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
                  <SelectItem value="Food refusal linked to swallowing">
                    Food refusal linked to swallowing
                  </SelectItem>
                  <SelectItem value="Prolonged eating time">
                    Prolonged eating time
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mtm_meal_intake">Meal Intake</Label>
                  <Select
                    value={formData.mtm_meal_intake || 'none'}
                    onValueChange={(val) =>
                      onFormChange(
                        'mtm_meal_intake',
                        val === 'none' ? null : val,
                      )
                    }
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
                  onChange={(e) =>
                    onFormChange('mtm_meal_intake_notes', e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mtm_fluid_intake">Fluid Intake</Label>
                  <Select
                    value={formData.mtm_fluid_intake || 'none'}
                    onValueChange={(val) =>
                      onFormChange(
                        'mtm_fluid_intake',
                        val === 'none' ? null : val,
                      )
                    }
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
                  onChange={(e) =>
                    onFormChange('mtm_fluid_intake_notes', e.target.value)
                  }
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
      {showHygiene && (
        <Card
          id="tracker_hygiene"
          className="animate-in fade-in slide-in-from-top-2"
        >
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
                  onValueChange={(val) =>
                    onFormChange('hygiene_shower', val === 'none' ? null : val)
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    <SelectItem value="Independently">Independently</SelectItem>
                    <SelectItem value="With prompting">
                      With prompting
                    </SelectItem>
                    <SelectItem value="Supervision required">
                      Supervision required
                    </SelectItem>
                    <SelectItem value="Assistance needed">
                      Assistance needed
                    </SelectItem>
                    <SelectItem value="Refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hygiene_oral_care">Oral Care</Label>
                <Select
                  value={formData.hygiene_oral_care || 'none'}
                  onValueChange={(val) =>
                    onFormChange(
                      'hygiene_oral_care',
                      val === 'none' ? null : val,
                    )
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    <SelectItem value="Independently">Independently</SelectItem>
                    <SelectItem value="With prompting">
                      With prompting
                    </SelectItem>
                    <SelectItem value="Supervision required">
                      Supervision required
                    </SelectItem>
                    <SelectItem value="Assistance needed">
                      Assistance needed
                    </SelectItem>
                    <SelectItem value="Refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hygiene_toileting">Toileting</Label>
                <Select
                  value={formData.hygiene_toileting || 'none'}
                  onValueChange={(val) =>
                    onFormChange(
                      'hygiene_toileting',
                      val === 'none' ? null : val,
                    )
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    <SelectItem value="Independently">Independently</SelectItem>
                    <SelectItem value="With prompting">
                      With prompting
                    </SelectItem>
                    <SelectItem value="Supervision required">
                      Supervision required
                    </SelectItem>
                    <SelectItem value="Assistance needed">
                      Assistance needed
                    </SelectItem>
                    <SelectItem value="Refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hygiene_grooming">Grooming</Label>
                <Select
                  value={formData.hygiene_grooming || 'none'}
                  onValueChange={(val) =>
                    onFormChange(
                      'hygiene_grooming',
                      val === 'none' ? null : val,
                    )
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    <SelectItem value="Independently">Independently</SelectItem>
                    <SelectItem value="With prompting">
                      With prompting
                    </SelectItem>
                    <SelectItem value="Supervision required">
                      Supervision required
                    </SelectItem>
                    <SelectItem value="Assistance needed">
                      Assistance needed
                    </SelectItem>
                    <SelectItem value="Refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hygiene_observed_concerns">
                Observed Concerns
              </Label>
              <Input
                id="hygiene_observed_concerns"
                value={formData.hygiene_observed_concerns || ''}
                onChange={(e) =>
                  onFormChange('hygiene_observed_concerns', e.target.value)
                }
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
