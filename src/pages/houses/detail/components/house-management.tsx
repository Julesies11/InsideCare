import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HouseParticipants } from './house-participants';
import { FileText, Users, Activity, Info } from 'lucide-react';

interface HouseManagementProps {
  houseId?: string;
  formData: Record<string, any>;
  onFieldChange: (field: string, value: string) => void;
  canEdit: boolean; // Only true for Admin or House Supervisor
}

export function HouseManagement({ 
  houseId, 
  formData, 
  onFieldChange,
  canEdit 
}: HouseManagementProps) {
  return (
    <div id="house_management">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5 text-gray-500" />
            House Management
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          {/* Participants Section - View Only */}
          <div id="house_participants" className="space-y-4">
            <Label className="text-sm font-bold flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Participants
            </Label>
            <div className="border rounded-lg p-4 bg-gray-50/50">
              <HouseParticipants 
                houseId={houseId}
                canAdd={false}
                canDelete={false}
                readOnly={true}
              />
            </div>
            <div className="border-b border-dashed my-6" />
          </div>

          <div id="house_management_details" className="flex flex-col gap-6">
            {/* Breakdown of individuals */}
            <div className="space-y-2">
              <Label className="text-sm font-bold flex items-center gap-2">
                <Users className="size-4 text-primary" />
                Breakdown of Individuals
              </Label>
              <Textarea
                value={formData.individuals_breakdown || ''}
                onChange={(e) => onFieldChange('individuals_breakdown', e.target.value)}
                placeholder={canEdit ? "Enter breakdown of individuals living in the house..." : "No information provided."}
                rows={4}
                disabled={!canEdit}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground italic">
                Qualitative description of each person residing here.
              </p>
            </div>

            {/* Dynamics within participants */}
            <div className="space-y-2">
              <Label className="text-sm font-bold flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                Dynamics within Participants
              </Label>
              <Textarea
                value={formData.participant_dynamics || ''}
                onChange={(e) => onFieldChange('participant_dynamics', e.target.value)}
                placeholder={canEdit ? "Enter details about social dynamics and interactions..." : "No information provided."}
                rows={4}
                disabled={!canEdit}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground italic">
                Example: A gets jealous when B gets too much attention, manage this by X.
              </p>
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <Label className="text-sm font-bold flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                Observations
              </Label>
              <Textarea
                value={formData.observations || ''}
                onChange={(e) => onFieldChange('observations', e.target.value)}
                placeholder={canEdit ? "Enter any recent observations or patterns..." : "No information provided."}
                rows={4}
                disabled={!canEdit}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground italic">
                Staff observations regarding the house environment and participant wellbeing.
              </p>
            </div>

            {/* General house details */}
            <div className="space-y-2">
              <Label className="text-sm font-bold flex items-center gap-2">
                <Info className="size-4 text-primary" />
                General House Details
              </Label>
              <Textarea
                value={formData.general_house_details || ''}
                onChange={(e) => onFieldChange('general_house_details', e.target.value)}
                placeholder={canEdit ? "Enter general house routines, preferences, and rules..." : "No information provided."}
                rows={4}
                disabled={!canEdit}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground italic">
                Example: Keep the kitchen light on at night; specific cleaning routines, etc.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
