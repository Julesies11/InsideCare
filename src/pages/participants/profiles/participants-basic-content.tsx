import { UserRoundPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Participants } from './components';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { participantsApi } from '@/api/participants.api';
import { ROUTES } from '@/config/routes.config';

export function ParticipantsProfilesContent() {
  const navigate = useNavigate();
  const { hasAccess } = useRBAC();
  
  const canAdd = hasAccess({ 
    resource: RBAC_MODULES.PARTICIPANTS, 
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE 
  });

  const handleAddParticipant = async () => {
    console.log('[DEBUG] handleAddParticipant triggered');
    try {
      // Create a new participant with minimal data (name can be NULL for drafts) using DAL
      const data = await participantsApi.create({
        status: 'draft',
      } as any);
      console.log('[DEBUG] participant created successfully:', data);

      if (!data) throw new Error("You do not have permission to perform this action");

      // Navigate to the detail page
      navigate(`${ROUTES.PARTICIPANT_DETAIL}/${data.id}`);
    } catch (error: any) {
      console.error('[DEBUG] FAILED to create participant:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast.error('Failed to create participant', { description: error.message });
    }
  };

  return (
    <div className="grid gap-5 lg:gap-7.5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Participant Profiles
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-400">
            Manage participant information and profiles
          </p>
        </div>
        {canAdd && (
          <Button onClick={handleAddParticipant}>
            <UserRoundPlus className="size-4" />
            Add Participant
          </Button>
        )}
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
              <UserRoundPlus className="size-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">
                Supporting Every Individual Journey
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Each participant profile represents a unique story of growth, independence, and achievement. 
                Your dedicated support makes their goals a reality.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants Table */}
      <Participants />
    </div>
  );
}
