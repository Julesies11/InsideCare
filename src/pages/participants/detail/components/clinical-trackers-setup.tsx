import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ClinicalTrackersSetupProps {
  canEdit: boolean;
  formData: Record<string, any>;
  onFormChange: (field: string, value: any) => void;
}

export function ClinicalTrackersSetup({
  canEdit,
  formData,
  onFormChange,
}: ClinicalTrackersSetupProps) {
  return (
    <Card className="pb-2.5" id="clinical-trackers">
      <CardHeader>
        <CardTitle>Clinical Trackers Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Configure which clinical detail trackers are enabled for this participant's shift notes.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3.5 border border-dashed rounded-lg border-gray-200">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="track_bowel" className="font-semibold text-sm cursor-pointer">Bowel Tracking</Label>
              <span className="text-xs text-muted-foreground">Track bowel movements and consistency</span>
            </div>
            <Switch
              id="track_bowel"
              checked={!!formData.track_bowel}
              onCheckedChange={(checked) => onFormChange('track_bowel', checked)}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between p-3.5 border border-dashed rounded-lg border-gray-200">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="track_seizure" className="font-semibold text-sm cursor-pointer">Seizure Activity</Label>
              <span className="text-xs text-muted-foreground">Track seizure occurrences, types, and duration</span>
            </div>
            <Switch
              id="track_seizure"
              checked={!!formData.track_seizure}
              onCheckedChange={(checked) => onFormChange('track_seizure', checked)}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between p-3.5 border border-dashed rounded-lg border-gray-200">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="track_sleep" className="font-semibold text-sm cursor-pointer">Sleep Tracking</Label>
              <span className="text-xs text-muted-foreground">Track sleep duration, quality, and disturbances</span>
            </div>
            <Switch
              id="track_sleep"
              checked={!!formData.track_sleep}
              onCheckedChange={(checked) => onFormChange('track_sleep', checked)}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between p-3.5 border border-dashed rounded-lg border-gray-200">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="track_behaviour" className="font-semibold text-sm cursor-pointer">Behaviour Observation</Label>
              <span className="text-xs text-muted-foreground">Track behaviors of concern and interventions</span>
            </div>
            <Switch
              id="track_behaviour"
              checked={!!formData.track_behaviour}
              onCheckedChange={(checked) => onFormChange('track_behaviour', checked)}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between p-3.5 border border-dashed rounded-lg border-gray-200">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="track_community" className="font-semibold text-sm cursor-pointer">Community Participation</Label>
              <span className="text-xs text-muted-foreground">Track community outings and participation details</span>
            </div>
            <Switch
              id="track_community"
              checked={!!formData.track_community}
              onCheckedChange={(checked) => onFormChange('track_community', checked)}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between p-3.5 border border-dashed rounded-lg border-gray-200">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="track_nutrition" className="font-semibold text-sm cursor-pointer">Nutrition Tracker</Label>
              <span className="text-xs text-muted-foreground">Track food/fluid intake and nutrition details</span>
            </div>
            <Switch
              id="track_nutrition"
              checked={!!formData.track_nutrition}
              onCheckedChange={(checked) => onFormChange('track_nutrition', checked)}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between p-3.5 border border-dashed rounded-lg border-gray-200">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="track_mtm" className="font-semibold text-sm cursor-pointer">Mealtime Management</Label>
              <span className="text-xs text-muted-foreground">Track mealtime management compliance and issues</span>
            </div>
            <Switch
              id="track_mtm"
              checked={!!formData.track_mtm}
              onCheckedChange={(checked) => onFormChange('track_mtm', checked)}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between p-3.5 border border-dashed rounded-lg border-gray-200">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="track_hygiene" className="font-semibold text-sm cursor-pointer">Hygiene Tracking</Label>
              <span className="text-xs text-muted-foreground">Track personal care and hygiene activities completed</span>
            </div>
            <Switch
              id="track_hygiene"
              checked={!!formData.track_hygiene}
              onCheckedChange={(checked) => onFormChange('track_hygiene', checked)}
              disabled={!canEdit}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
