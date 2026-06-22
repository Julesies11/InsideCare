import { useState } from 'react';
import {
  Activity,
  Brain,
  Droplet,
  Moon,
  Navigation,
  ShowerHead,
  Utensils,
  Plus,
} from 'lucide-react';
import { useClinicalTrackersMaster } from '@/hooks/use-clinical-trackers-master';
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
import { BristolScalePicker } from '../bristol-scale-picker';
import { Button } from '@/components/ui/button';
import { ClinicalTrackerMasterDialog } from '@/pages/admin/clinical-trackers/components/clinical-tracker-master-dialog';
import { TABLES } from '@/config/db-tables';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { RBAC_MODULES } from '@/config/rbac-modules';

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
  const { data: trackerMasters = {} as any } = useClinicalTrackersMaster();

  const disabled = !canEdit;

  const { hasAccess } = useRBAC();
  const canManageMasterLists = hasAccess({
    resource: RBAC_MODULES.MASTER_LISTS,
    requiredLevel: ACCESS_LEVEL.FULL,
  });

  const [selectedTaxonomy, setSelectedTaxonomy] = useState<{
    id: string;
    label: string;
    table: keyof typeof TABLES;
  } | null>(null);

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
                  value={formData.bowel_bristol_scale as number}
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
                      value={(formData.bowel_time as string) || ''}
                      onChange={(e) =>
                        onFormChange('bowel_time', e.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bowel_amount_id">Amount</Label>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1">
                        <Select
                          value={(formData.bowel_amount_id as string) || 'none'}
                          onValueChange={(val) =>
                            onFormChange(
                              'bowel_amount_id',
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
                            {trackerMasters.BOWEL_AMOUNTS_MASTER?.map((item: any) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {!disabled && canManageMasterLists && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-9 shrink-0"
                          onClick={() =>
                            setSelectedTaxonomy({
                              id: 'BOWEL_AMOUNTS_MASTER',
                              label: 'Bowel Amount',
                              table: 'BOWEL_AMOUNTS_MASTER',
                            })
                          }
                          title="Manage Bowel Amounts"
                        >
                          <Plus className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bowel_assistance_id">
                    Assistance Required
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1">
                      <Select
                        value={(formData.bowel_assistance_id as string) || 'none'}
                        onValueChange={(val) =>
                          onFormChange(
                            'bowel_assistance_id',
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
                          {trackerMasters.BOWEL_ASSISTANCE_MASTER?.map((item: any) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {!disabled && canManageMasterLists && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9 shrink-0"
                        onClick={() =>
                          setSelectedTaxonomy({
                            id: 'BOWEL_ASSISTANCE_MASTER',
                            label: 'Bowel Assistance',
                            table: 'BOWEL_ASSISTANCE_MASTER',
                          })
                        }
                        title="Manage Bowel Assistance"
                      >
                        <Plus className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bowel_notes">Extra Notes</Label>
              <Textarea
                id="bowel_notes"
                value={(formData.bowel_notes as string) || ''}
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
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Seizure Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seizure_time_started">Time Started</Label>
                <Input
                  id="seizure_time_started"
                  type="time"
                  value={(formData.seizure_time_started as string) || ''}
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
                  value={(formData.seizure_duration_minutes as string) || ''}
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
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Select
                      value={(formData.seizure_type_id as string) || 'none'}
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
                        {trackerMasters.SEIZURE_TYPES_MASTER?.map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!disabled && canManageMasterLists && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() =>
                        setSelectedTaxonomy({
                          id: 'SEIZURE_TYPES_MASTER',
                          label: 'Seizure Type',
                          table: 'SEIZURE_TYPES_MASTER',
                        })
                      }
                      title="Manage Seizure Types"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seizure_description">Description</Label>
              <Textarea
                id="seizure_description"
                value={(formData.seizure_description as string) || ''}
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
                      value={(formData.seizure_injury_description as string) || ''}
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
                    value={(formData.seizure_notes as string) || ''}
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
                <Label htmlFor="sleep_type_id">Sleep Type</Label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Select
                      value={(formData.sleep_type_id as string) || 'none'}
                      onValueChange={(val) =>
                        onFormChange(
                          'sleep_type_id',
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
                        {trackerMasters.SLEEP_TYPES_MASTER?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!disabled && canManageMasterLists && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() =>
                        setSelectedTaxonomy({
                          id: 'SLEEP_TYPES_MASTER',
                          label: 'Sleep Type',
                          table: 'SLEEP_TYPES_MASTER',
                        })
                      }
                      title="Manage Sleep Types"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sleep_start_time">Sleep Start Time</Label>
                <Input
                  id="sleep_start_time"
                  type="time"
                  value={(formData.sleep_start_time as string) || ''}
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
                  value={(formData.sleep_wake_time as string) || ''}
                  onChange={(e) =>
                    onFormChange('sleep_wake_time', e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sleep_quality_id">Sleep Quality</Label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Select
                      value={(formData.sleep_quality_id as string) || 'none'}
                      onValueChange={(val) =>
                        onFormChange(
                          'sleep_quality_id',
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
                        {trackerMasters.SLEEP_QUALITY_MASTER?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!disabled && canManageMasterLists && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() =>
                        setSelectedTaxonomy({
                          id: 'SLEEP_QUALITY_MASTER',
                          label: 'Sleep Quality',
                          table: 'SLEEP_QUALITY_MASTER',
                        })
                      }
                      title="Manage Sleep Quality"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sleep_support_required">
                Support Required During Sleep
              </Label>
              <Textarea
                id="sleep_support_required"
                value={(formData.sleep_support_required as string) || ''}
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
            <CardTitle className="flex items-center gap-2">
              <Brain className="size-4 text-primary" />
              Behaviour Observation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="behaviour_type_id">Behaviour Type</Label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Select
                      value={(formData.behaviour_type_id as string) || 'none'}
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
                        {trackerMasters.BEHAVIOUR_TYPES_MASTER?.map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!disabled && canManageMasterLists && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() =>
                        setSelectedTaxonomy({
                          id: 'BEHAVIOUR_TYPES_MASTER',
                          label: 'Behaviour Type',
                          table: 'BEHAVIOUR_TYPES_MASTER',
                        })
                      }
                      title="Manage Behaviour Types"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="behaviour_intensity_id">Intensity</Label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Select
                      value={(formData.behaviour_intensity_id as string) || 'none'}
                      onValueChange={(val) =>
                        onFormChange(
                          'behaviour_intensity_id',
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
                        {trackerMasters.BEHAVIOUR_INTENSITY_MASTER?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!disabled && canManageMasterLists && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() =>
                        setSelectedTaxonomy({
                          id: 'BEHAVIOUR_INTENSITY_MASTER',
                          label: 'Behaviour Intensity',
                          table: 'BEHAVIOUR_INTENSITY_MASTER',
                        })
                      }
                      title="Manage Behaviour Intensity"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="behaviour_notes">Notes</Label>
              <Textarea
                id="behaviour_notes"
                value={(formData.behaviour_notes as string) || ''}
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
                  value={(formData.community_activity_type as string) || ''}
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
                  value={(formData.community_location as string) || ''}
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
                  value={(formData.community_engagement_level as string) || ''}
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
                value={(formData.community_notes as string) || ''}
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
                <Label htmlFor="nutrition_meal_type_id">Meal Type</Label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Select
                      value={(formData.nutrition_meal_type_id as string) || 'none'}
                      onValueChange={(val) =>
                        onFormChange(
                          'nutrition_meal_type_id',
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
                        {trackerMasters.NUTRITION_MEAL_TYPES_MASTER?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!disabled && canManageMasterLists && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() =>
                        setSelectedTaxonomy({
                          id: 'NUTRITION_MEAL_TYPES_MASTER',
                          label: 'Nutrition Meal Type',
                          table: 'NUTRITION_MEAL_TYPES_MASTER',
                        })
                      }
                      title="Manage Nutrition Meal Types"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nutrition_intake_id">Intake</Label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Select
                      value={(formData.nutrition_intake_id as string) || 'none'}
                      onValueChange={(val) =>
                        onFormChange(
                          'nutrition_intake_id',
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
                        {trackerMasters.NUTRITION_INTAKE_MASTER?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!disabled && canManageMasterLists && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() =>
                        setSelectedTaxonomy({
                          id: 'NUTRITION_INTAKE_MASTER',
                          label: 'Nutrition Intake',
                          table: 'NUTRITION_INTAKE_MASTER',
                        })
                      }
                      title="Manage Nutrition Intake"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nutrition_fluids_intake">Fluids Intake</Label>
                <Input
                  id="nutrition_fluids_intake"
                  value={(formData.nutrition_fluids_intake as string) || ''}
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
                  value={(formData.nutrition_assistance_needed as string) || ''}
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
                  value={(formData.nutrition_refusal_alternatives as string) || ''}
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
                value={(formData.nutrition_notes as string) || ''}
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
                <Label htmlFor="mtm_diet_type_id">Diet Type</Label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Select
                      value={(formData.mtm_diet_type_id as string) || 'none'}
                      onValueChange={(val) =>
                        onFormChange('mtm_diet_type_id', val === 'none' ? null : val)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select diet..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select diet...</SelectItem>
                        {trackerMasters.MTM_DIET_TYPES_MASTER?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!disabled && canManageMasterLists && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() =>
                        setSelectedTaxonomy({
                          id: 'MTM_DIET_TYPES_MASTER',
                          label: 'MTM Diet Type',
                          table: 'MTM_DIET_TYPES_MASTER',
                        })
                      }
                      title="Manage MTM Diet Types"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mtm_fluids_id">Fluids Consistency</Label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Select
                      value={(formData.mtm_fluids_id as string) || 'none'}
                      onValueChange={(val) =>
                        onFormChange('mtm_fluids_id', val === 'none' ? null : val)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select consistency..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select consistency...</SelectItem>
                        {trackerMasters.MTM_FLUIDS_MASTER?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!disabled && canManageMasterLists && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() =>
                        setSelectedTaxonomy({
                          id: 'MTM_FLUIDS_MASTER',
                          label: 'MTM Fluids Consistency',
                          table: 'MTM_FLUIDS_MASTER',
                        })
                      }
                      title="Manage MTM Fluids Consistency"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
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
              <Label htmlFor="mtm_swallowing_concerns_id">
                Any swallowing concerns?
              </Label>
              <div className="flex items-center gap-1.5">
                <div className="flex-1">
                  <Select
                    value={(formData.mtm_swallowing_concerns_id as string) || 'none'}
                    onValueChange={(val) =>
                      onFormChange('mtm_swallowing_concerns_id', val === 'none' ? null : val)
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select...</SelectItem>
                      {trackerMasters.MTM_SWALLOWING_CONCERNS_MASTER?.map((item: any) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!disabled && canManageMasterLists && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9 shrink-0"
                    onClick={() =>
                      setSelectedTaxonomy({
                        id: 'MTM_SWALLOWING_CONCERNS_MASTER',
                        label: 'MTM Swallowing Concern',
                        table: 'MTM_SWALLOWING_CONCERNS_MASTER',
                      })
                    }
                    title="Manage Swallowing Concerns"
                  >
                    <Plus className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mtm_meal_intake_id">Meal Intake</Label>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1">
                      <Select
                        value={(formData.mtm_meal_intake_id as string) || 'none'}
                        onValueChange={(val) =>
                          onFormChange(
                            'mtm_meal_intake_id',
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
                          {trackerMasters.MTM_MEAL_INTAKE_MASTER?.map((item: any) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {!disabled && canManageMasterLists && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9 shrink-0"
                        onClick={() =>
                          setSelectedTaxonomy({
                            id: 'MTM_MEAL_INTAKE_MASTER',
                            label: 'MTM Meal Intake',
                            table: 'MTM_MEAL_INTAKE_MASTER',
                          })
                        }
                        title="Manage MTM Meal Intake"
                      >
                        <Plus className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <Input
                  placeholder="Intake notes..."
                  value={(formData.mtm_meal_intake_notes as string) || ''}
                  onChange={(e) =>
                    onFormChange('mtm_meal_intake_notes', e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mtm_fluid_intake_id">Fluid Intake</Label>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1">
                      <Select
                        value={(formData.mtm_fluid_intake_id as string) || 'none'}
                        onValueChange={(val) =>
                          onFormChange(
                            'mtm_fluid_intake_id',
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
                          {trackerMasters.MTM_FLUID_INTAKE_MASTER?.map((item: any) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {!disabled && canManageMasterLists && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9 shrink-0"
                        onClick={() =>
                          setSelectedTaxonomy({
                            id: 'MTM_FLUID_INTAKE_MASTER',
                            label: 'MTM Fluid Intake',
                            table: 'MTM_FLUID_INTAKE_MASTER',
                          })
                        }
                        title="Manage MTM Fluid Intake"
                      >
                        <Plus className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <Input
                  placeholder="Fluid intake notes..."
                  value={(formData.mtm_fluid_intake_notes as string) || ''}
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
                value={(formData.mtm_notes as string) || ''}
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
                <Label htmlFor="hygiene_shower_id">Shower</Label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Select
                      value={(formData.hygiene_shower_id as string) || 'none'}
                      onValueChange={(val) =>
                        onFormChange('hygiene_shower_id', val === 'none' ? null : val)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select...</SelectItem>
                        {trackerMasters.HYGIENE_LEVELS_MASTER?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!disabled && canManageMasterLists && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() =>
                        setSelectedTaxonomy({
                          id: 'HYGIENE_LEVELS_MASTER',
                          label: 'Hygiene Support Level',
                          table: 'HYGIENE_LEVELS_MASTER',
                        })
                      }
                      title="Manage Hygiene Support Levels"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hygiene_oral_care_id">Oral Care</Label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Select
                      value={(formData.hygiene_oral_care_id as string) || 'none'}
                      onValueChange={(val) =>
                        onFormChange(
                          'hygiene_oral_care_id',
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
                        {trackerMasters.HYGIENE_LEVELS_MASTER?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!disabled && canManageMasterLists && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() =>
                        setSelectedTaxonomy({
                          id: 'HYGIENE_LEVELS_MASTER',
                          label: 'Hygiene Support Level',
                          table: 'HYGIENE_LEVELS_MASTER',
                        })
                      }
                      title="Manage Hygiene Support Levels"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hygiene_toileting_id">Toileting</Label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Select
                      value={(formData.hygiene_toileting_id as string) || 'none'}
                      onValueChange={(val) =>
                        onFormChange(
                          'hygiene_toileting_id',
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
                        {trackerMasters.HYGIENE_LEVELS_MASTER?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!disabled && canManageMasterLists && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() =>
                        setSelectedTaxonomy({
                          id: 'HYGIENE_LEVELS_MASTER',
                          label: 'Hygiene Support Level',
                          table: 'HYGIENE_LEVELS_MASTER',
                        })
                      }
                      title="Manage Hygiene Support Levels"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hygiene_grooming_id">Grooming</Label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Select
                      value={(formData.hygiene_grooming_id as string) || 'none'}
                      onValueChange={(val) =>
                        onFormChange(
                          'hygiene_grooming_id',
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
                        {trackerMasters.HYGIENE_LEVELS_MASTER?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!disabled && canManageMasterLists && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() =>
                        setSelectedTaxonomy({
                          id: 'HYGIENE_LEVELS_MASTER',
                          label: 'Hygiene Support Level',
                          table: 'HYGIENE_LEVELS_MASTER',
                        })
                      }
                      title="Manage Hygiene Support Levels"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hygiene_observed_concerns">
                Observed Concerns
              </Label>
              <Input
                id="hygiene_observed_concerns"
                value={(formData.hygiene_observed_concerns as string) || ''}
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
                value={(formData.hygiene_notes as string) || ''}
                onChange={(e) => onFormChange('hygiene_notes', e.target.value)}
                placeholder="Extra details..."
                rows={2}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {canManageMasterLists && selectedTaxonomy && (
        <ClinicalTrackerMasterDialog
          open={!!selectedTaxonomy}
          onClose={() => setSelectedTaxonomy(null)}
          taxonomy={selectedTaxonomy}
        />
      )}
    </div>
  );
}
