import { UserRoundPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Participants } from './components';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { TABLES } from '@/config/db-tables';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';

export function ParticipantsProfilesContent() {
  const navigate = useNavigate();
  const { hasAccess } = useRBAC();
  
  const canAdd = hasAccess({ 
    resource: RBAC_MODULES.PARTICIPANTS, 
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE 
  });

  const handleAddParticipant = async () => {
    try {
      // Create a new participant with minimal data (name can be NULL for drafts)
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANTS)
        .insert([
          {
            status: 'draft',
          },
        ])
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to perform this action");

      // Navigate to the detail page
      navigate(`/participants/detail/${data.id}`);
    } catch (error) {
      const err = error as Error;
      console.error('Error creating participant:', err);
      toast.error('Failed to create participant', { description: err.message });
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
