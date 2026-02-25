import { House as HouseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Houses } from './components';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity-logger';

export function HousesProfilesContent() {
  const navigate = useNavigate();

  const handleAddHouse = async () => {
    try {
      // Create a new house with minimal data
      const { data, error } = await supabase
        .from('houses')
        .insert([
          {
            name: 'New House',
            status: 'active',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Log the activity
      await logActivity({
        activityType: 'create',
        entityType: 'house',
        entityId: data.id,
        entityName: data.name || 'New House',
        userName: 'Current User', // TODO: Get from auth context
      });

      // Navigate to the detail page
      navigate(`/houses/detail/${data.id}`);
    } catch (error: any) {
      console.error('Error creating house:', error);
      toast.error('Failed to create house', { description: error.message });
    }
  };

  return (
    <div className="grid gap-5 lg:gap-7.5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            House Management
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-400">
            Manage house information and settings
          </p>
        </div>
        <Button onClick={handleAddHouse}>
          <HouseIcon className="size-4" />
          Add House
        </Button>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
              <HouseIcon className="size-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold text-green-900 dark:text-green-100">
                Creating Safe and Comfortable Homes
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Each house represents a safe haven where individuals can thrive, grow, and feel at home. 
                Your management ensures quality living environments for everyone.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Houses Table */}
      <Houses />
    </div>
  );
}
